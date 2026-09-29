import { createLogger } from '@temp-repo/logger'
import { type Member, MemberSchema, type RoomEvent } from '@temp-repo/studio-domain'
import type { RedisClient } from 'bun'
import { PRESENCE_TTL_S } from './constants'
import type { RoomBus, RoomListener } from './types'
import {
  aliveKey,
  isExpired,
  membersKey,
  parseEvent,
  roomChannel,
  serializeEvent,
  withStatus,
} from './utils'

const logger = createLogger('room-bus')

/**
 * Cross-instance bus: events fan out over a channel per room; presence lives in a
 * hash plus a TTL'd alive key per member, so a dead instance's users expire on read.
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

  subscribe(roomId: string, listener: RoomListener): () => void {
    const channel = roomChannel(roomId)
    const onMessage = (raw: string) => {
      const event = parseEvent(raw)
      if (event) listener(event)
      else logger.warn({ roomId }, 'dropped malformed room event')
    }
    this.subscriber
      .subscribe(channel, onMessage)
      .catch((err) => logger.warn({ err: String(err), roomId }, 'subscribe failed'))
    return () => {
      this.subscriber.unsubscribe(channel, onMessage).catch(() => {})
    }
  }

  async join(roomId: string, member: Member): Promise<void> {
    const now = Date.now()
    await this.commands.hset(membersKey(roomId), { [member.userId]: JSON.stringify(member) })
    await this.commands.set(aliveKey(roomId, member.userId), String(now), 'EX', PRESENCE_TTL_S)
    await this.publish(roomId, { type: 'join', member })
  }

  async heartbeat(roomId: string, userId: string): Promise<void> {
    await this.commands.set(aliveKey(roomId, userId), String(Date.now()), 'EX', PRESENCE_TTL_S)
  }

  async leave(roomId: string, userId: string): Promise<void> {
    await this.commands.hdel(membersKey(roomId), userId)
    await this.commands.del(aliveKey(roomId, userId))
    await this.publish(roomId, { type: 'leave', userId })
  }

  async members(roomId: string): Promise<Member[]> {
    const now = Date.now()
    const raw = await this.commands.hgetall(membersKey(roomId))
    const members = await Promise.all(
      Object.entries(raw).map(async ([userId, json]) => {
        const lastSeen = Number(await this.commands.get(aliveKey(roomId, userId)))
        const parsed = MemberSchema.safeParse(JSON.parse(json))
        if (!parsed.success || !lastSeen || isExpired(lastSeen, now)) {
          await this.commands.hdel(membersKey(roomId), userId)
          return undefined
        }
        return withStatus(parsed.data, lastSeen, now)
      }),
    )
    return members.filter((m): m is Member => m !== undefined)
  }
}
