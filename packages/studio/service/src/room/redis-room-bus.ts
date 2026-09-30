import { createLogger } from '@temp-repo/logger'
import { type Member, MemberSchema, type RoomEvent } from '@temp-repo/studio-domain'
import type { RedisClient } from 'bun'
import { PRESENCE_TTL_S } from './constants'
import type { MemberStatus, PresenceRecord, RoomBus, RoomListener } from './types'
import {
  aggregateMembers,
  aliveKey,
  isExpired,
  membersKey,
  parseEvent,
  roomChannel,
  serializeEvent,
} from './utils'

const logger = createLogger('room-bus')

// Alive keys are addressed by prefix inside the scripts (fine on a single node; cluster
// mode would want them hashed into the room's slot).
const COUNT_LIVE_LUA = `
local function liveConnections(hash, alivePrefix, userId)
  local n = 0
  local all = redis.call('HGETALL', hash)
  for i = 1, #all, 2 do
    local m = cjson.decode(all[i + 1])
    if m.userId == userId and redis.call('EXISTS', alivePrefix .. all[i]) == 1 then n = n + 1 end
  end
  return n
end
`
/**
 * KEYS[1]=members hash · ARGV: connectionId, memberJson, now, ttl, userId, alivePrefix,
 * channel, joinPayload → live count. Publishes inside the script so the transition event
 * is ordered with the state change across instances.
 */
const JOIN_LUA = `${COUNT_LIVE_LUA}
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
redis.call('SET', ARGV[6] .. ARGV[1], ARGV[3], 'EX', ARGV[4])
local n = liveConnections(KEYS[1], ARGV[6], ARGV[5])
if n == 1 then redis.call('PUBLISH', ARGV[7], ARGV[8]) end
return n
`
/**
 * KEYS[1]=members hash, KEYS[2]=alive key · ARGV: connectionId, memberJson, now, ttl.
 * Keeps an existing record (it may carry a client-set status); only writes the JSON when
 * the record is missing.
 */
const HEARTBEAT_LUA = `
if redis.call('HEXISTS', KEYS[1], ARGV[1]) == 0 then redis.call('HSET', KEYS[1], ARGV[1], ARGV[2]) end
redis.call('SET', KEYS[2], ARGV[3], 'EX', ARGV[4])
`
/** KEYS[1]=members hash · ARGV: userId, status → records updated */
const SET_STATUS_LUA = `
local n = 0
local all = redis.call('HGETALL', KEYS[1])
for i = 1, #all, 2 do
  local m = cjson.decode(all[i + 1])
  if m.userId == ARGV[1] then
    m.status = ARGV[2]
    redis.call('HSET', KEYS[1], all[i], cjson.encode(m))
    n = n + 1
  end
end
return n
`
/** KEYS[1]=members hash, KEYS[2]=alive key · ARGV: connectionId → 1 if the stale record was dropped */
const PRUNE_LUA = `
if redis.call('EXISTS', KEYS[2]) == 1 then return 0 end
return redis.call('HDEL', KEYS[1], ARGV[1])
`
/**
 * KEYS[1]=members hash · ARGV: connectionId, alivePrefix, channel, leavePayloadPrefix
 * → [userId, remaining live count]. The leave event is published inside the script.
 */
const LEAVE_LUA = `${COUNT_LIVE_LUA}
local raw = redis.call('HGET', KEYS[1], ARGV[1])
redis.call('HDEL', KEYS[1], ARGV[1])
redis.call('DEL', ARGV[2] .. ARGV[1])
if not raw then return { '', -1 } end
local userId = cjson.decode(raw).userId
local n = liveConnections(KEYS[1], ARGV[2], userId)
if n == 0 then redis.call('PUBLISH', ARGV[3], ARGV[4]) end
return { userId, n }
`

/**
 * Cross-instance bus: events fan out over a channel per room; presence is a hash of
 * connectionId → member plus a TTL'd alive key per connection, so a dead instance's
 * connections expire on read.
 */
export class RedisRoomBus implements RoomBus {
  private readonly listeners = new Map<string, Set<(raw: string) => void>>()
  private readonly reconnectListeners = new Set<() => void>()
  private connectedOnce = false

  constructor(
    private readonly commands: RedisClient,
    private readonly subscriber: RedisClient,
  ) {
    // Bun re-establishes the connection but not the SUBSCRIBEs; redo them and tell the
    // hub, because anything published during the outage never reached this instance.
    this.subscriber.onconnect = () => {
      if (!this.connectedOnce) {
        this.connectedOnce = true
        return
      }
      logger.warn('subscriber reconnected; restoring subscriptions')
      this.restoreSubscriptions()
        .then(() => {
          for (const listener of this.reconnectListeners) listener()
        })
        .catch((err) => logger.warn({ err: String(err) }, 'restoring subscriptions failed'))
    }
    this.subscriber.onclose = (err) => logger.warn({ err: String(err) }, 'subscriber closed')
    this.commands.onclose = (err) => logger.warn({ err: String(err) }, 'commands closed')
  }

  async publish(roomId: string, event: RoomEvent): Promise<void> {
    try {
      await this.commands.publish(roomChannel(roomId), serializeEvent(event))
    } catch (err) {
      logger.warn({ err: String(err), roomId, type: event.type }, 'publish failed')
    }
  }

  async subscribe(roomId: string, listener: RoomListener): Promise<() => void> {
    const channel = roomChannel(roomId)
    const onMessage = (raw: string) => {
      const event = parseEvent(raw)
      if (event) listener(event)
      else logger.warn({ roomId }, 'dropped malformed room event')
    }
    let set = this.listeners.get(channel)
    if (!set) {
      set = new Set()
      this.listeners.set(channel, set)
    }
    set.add(onMessage)
    await this.subscriber.subscribe(channel, onMessage)
    return () => {
      set.delete(onMessage)
      if (set.size === 0) this.listeners.delete(channel)
      this.subscriber.unsubscribe(channel, onMessage).catch(() => {})
    }
  }

  onReconnect(listener: () => void): () => void {
    this.reconnectListeners.add(listener)
    return () => this.reconnectListeners.delete(listener)
  }

  close(): void {
    this.subscriber.close()
    this.commands.close()
  }

  // Bun keeps the local listener across the reconnect while the server-side SUBSCRIBE is
  // gone; re-subscribing without dropping it first would deliver every message twice.
  private async restoreSubscriptions(): Promise<void> {
    for (const [channel, set] of this.listeners) {
      for (const onMessage of set) {
        await this.subscriber.unsubscribe(channel, onMessage).catch(() => {})
        await this.subscriber.subscribe(channel, onMessage)
      }
    }
  }

  // Join/leave decide first-or-last inside one script, so concurrent connections of the
  // same user cannot both see "someone else is here" and both stay silent.
  async join(roomId: string, connectionId: string, member: Member): Promise<void> {
    try {
      await this.commands.eval(
        JOIN_LUA,
        1,
        membersKey(roomId),
        connectionId,
        JSON.stringify(member),
        String(Date.now()),
        PRESENCE_TTL_S,
        member.userId,
        aliveKey(roomId, ''),
        roomChannel(roomId),
        serializeEvent({ type: 'join', member }),
      )
    } catch (err) {
      logger.warn({ err: String(err), roomId }, 'join failed')
      throw err
    }
  }

  async heartbeat(roomId: string, connectionId: string, member: Member): Promise<void> {
    await this.commands.eval(
      HEARTBEAT_LUA,
      2,
      membersKey(roomId),
      aliveKey(roomId, connectionId),
      connectionId,
      JSON.stringify(member),
      String(Date.now()),
      PRESENCE_TTL_S,
    )
  }

  async leave(roomId: string, connectionId: string): Promise<boolean> {
    const raw = await this.commands.hget(membersKey(roomId), connectionId)
    const parsed = raw ? MemberSchema.safeParse(JSON.parse(raw)) : undefined
    const userId = parsed?.success ? parsed.data.userId : ''
    const result = (await this.commands.eval(
      LEAVE_LUA,
      1,
      membersKey(roomId),
      connectionId,
      aliveKey(roomId, ''),
      roomChannel(roomId),
      serializeEvent({ type: 'leave', userId }),
    )) as [string, number]
    const remaining = Number(result[1])
    return Boolean(result[0]) && remaining === 0
  }

  async setStatus(roomId: string, userId: string, status: MemberStatus): Promise<void> {
    await this.commands.eval(SET_STATUS_LUA, 1, membersKey(roomId), userId, status)
    await this.publish(roomId, { type: 'presence', members: await this.members(roomId) })
  }

  async members(roomId: string): Promise<Member[]> {
    return aggregateMembers(await this.liveRecords(roomId, Date.now()))
  }

  // Drop the record only if the alive key is still missing at that instant, so a heartbeat
  // landing between the read and the delete wins.
  private async prune(roomId: string, connectionId: string): Promise<void> {
    await this.commands.eval(
      PRUNE_LUA,
      2,
      membersKey(roomId),
      aliveKey(roomId, connectionId),
      connectionId,
    )
  }

  private async liveRecords(roomId: string, now: number): Promise<PresenceRecord[]> {
    const raw = await this.commands.hgetall(membersKey(roomId))
    const records = await Promise.all(
      Object.entries(raw).map(async ([connectionId, json]) => {
        const parsed = MemberSchema.safeParse(JSON.parse(json))
        const lastSeen = Number(await this.commands.get(aliveKey(roomId, connectionId)))
        if (!parsed.success || !lastSeen || isExpired(lastSeen, now)) {
          await this.prune(roomId, connectionId)
          return undefined
        }
        return { member: parsed.data, lastSeen }
      }),
    )
    return records.filter((r): r is PresenceRecord => r !== undefined)
  }
}
