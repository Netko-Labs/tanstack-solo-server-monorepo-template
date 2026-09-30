import { createLogger } from '@temp-repo/logger'
import { type Member, MemberSchema, type RoomEvent } from '@temp-repo/studio-domain'
import type { RedisClient } from 'bun'
import { PRESENCE_TTL_S } from './constants'
import type { PresenceRecord, RoomBus, RoomListener } from './types'
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
/** KEYS[1]=members hash · ARGV: connectionId, memberJson, now, ttl, userId, alivePrefix → live count */
const JOIN_LUA = `${COUNT_LIVE_LUA}
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
redis.call('SET', ARGV[6] .. ARGV[1], ARGV[3], 'EX', ARGV[4])
return liveConnections(KEYS[1], ARGV[6], ARGV[5])
`
/** KEYS[1]=members hash, KEYS[2]=alive key · ARGV: connectionId → 1 if the stale record was dropped */
const PRUNE_LUA = `
if redis.call('EXISTS', KEYS[2]) == 1 then return 0 end
return redis.call('HDEL', KEYS[1], ARGV[1])
`
/** KEYS[1]=members hash · ARGV: connectionId, alivePrefix → [userId, remaining live count] */
const LEAVE_LUA = `${COUNT_LIVE_LUA}
local raw = redis.call('HGET', KEYS[1], ARGV[1])
redis.call('HDEL', KEYS[1], ARGV[1])
redis.call('DEL', ARGV[2] .. ARGV[1])
if not raw then return { '', -1 } end
local userId = cjson.decode(raw).userId
return { userId, liveConnections(KEYS[1], ARGV[2], userId) }
`

/**
 * Cross-instance bus: events fan out over a channel per room; presence is a hash of
 * connectionId → member plus a TTL'd alive key per connection, so a dead instance's
 * connections expire on read.
 */
export class RedisRoomBus implements RoomBus {
  constructor(
    private readonly commands: RedisClient,
    private readonly subscriber: RedisClient,
  ) {}

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
    await this.subscriber.subscribe(channel, onMessage)
    return () => {
      this.subscriber.unsubscribe(channel, onMessage).catch(() => {})
    }
  }

  // Join/leave decide first-or-last inside one script, so concurrent connections of the
  // same user cannot both see "someone else is here" and both stay silent.
  async join(roomId: string, connectionId: string, member: Member): Promise<void> {
    const live = Number(
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
      ),
    )
    if (live === 1) await this.publish(roomId, { type: 'join', member })
  }

  async heartbeat(roomId: string, connectionId: string, member: Member): Promise<void> {
    await this.commands.hset(membersKey(roomId), { [connectionId]: JSON.stringify(member) })
    await this.commands.set(
      aliveKey(roomId, connectionId),
      String(Date.now()),
      'EX',
      PRESENCE_TTL_S,
    )
  }

  async leave(roomId: string, connectionId: string): Promise<boolean> {
    const result = (await this.commands.eval(
      LEAVE_LUA,
      1,
      membersKey(roomId),
      connectionId,
      aliveKey(roomId, ''),
    )) as [string, number]
    const [userId, remaining] = result
    if (!userId || Number(remaining) < 0) return false
    const last = Number(remaining) === 0
    if (last) await this.publish(roomId, { type: 'leave', userId })
    return last
  }

  async members(roomId: string): Promise<Member[]> {
    const now = Date.now()
    return aggregateMembers(await this.liveRecords(roomId, now), now)
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
