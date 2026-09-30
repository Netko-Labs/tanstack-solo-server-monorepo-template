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

  // Write first, decide after: concurrent join/leave of the same user converge on the
  // live connection count instead of racing on a read-then-write.
  async join(roomId: string, connectionId: string, member: Member): Promise<void> {
    await this.commands.hset(membersKey(roomId), { [connectionId]: JSON.stringify(member) })
    await this.commands.set(
      aliveKey(roomId, connectionId),
      String(Date.now()),
      'EX',
      PRESENCE_TTL_S,
    )
    if ((await this.liveConnections(roomId, member.userId)) === 1) {
      await this.publish(roomId, { type: 'join', member })
    }
  }

  async heartbeat(roomId: string, connectionId: string): Promise<void> {
    await this.commands.set(
      aliveKey(roomId, connectionId),
      String(Date.now()),
      'EX',
      PRESENCE_TTL_S,
    )
  }

  async leave(roomId: string, connectionId: string): Promise<boolean> {
    const raw = await this.commands.hget(membersKey(roomId), connectionId)
    await this.commands.hdel(membersKey(roomId), connectionId)
    await this.commands.del(aliveKey(roomId, connectionId))
    const parsed = raw ? MemberSchema.safeParse(JSON.parse(raw)) : undefined
    if (!parsed?.success) return false
    const last = (await this.liveConnections(roomId, parsed.data.userId)) === 0
    if (last) await this.publish(roomId, { type: 'leave', userId: parsed.data.userId })
    return last
  }

  async members(roomId: string): Promise<Member[]> {
    const now = Date.now()
    return aggregateMembers(await this.liveRecords(roomId, now), now)
  }

  private async liveConnections(roomId: string, userId: string): Promise<number> {
    const records = await this.liveRecords(roomId, Date.now())
    return records.filter((record) => record.member.userId === userId).length
  }

  private async liveRecords(roomId: string, now: number): Promise<PresenceRecord[]> {
    const raw = await this.commands.hgetall(membersKey(roomId))
    const records = await Promise.all(
      Object.entries(raw).map(async ([connectionId, json]) => {
        const lastSeen = Number(await this.commands.get(aliveKey(roomId, connectionId)))
        const parsed = MemberSchema.safeParse(JSON.parse(json))
        if (!parsed.success || !lastSeen || isExpired(lastSeen, now)) {
          await this.commands.hdel(membersKey(roomId), connectionId)
          return undefined
        }
        return { member: parsed.data, lastSeen }
      }),
    )
    return records.filter((r): r is PresenceRecord => r !== undefined)
  }
}
