import { createLogger } from '@temp-repo/logger'
import { type Member, MemberSchema, type RoomEvent } from '@temp-repo/studio-domain'
import type { RedisClient } from 'bun'
import { PRESENCE_TTL_S, RESTORE_BACKOFF_MAX_MS, RESTORE_BACKOFF_MS } from '../constants'
import type { MemberStatus, PresenceRecord, RoomBus, RoomListener } from '../types'
import {
  aggregateMembers,
  aliveKey,
  isExpired,
  membersKey,
  parseEvent,
  roomChannel,
  serializeEvent,
} from '../utils'
import { HEARTBEAT_LUA, JOIN_LUA, LEAVE_LUA, PRUNE_LUA, SET_STATUS_LUA } from './constants'

const logger = createLogger('room-bus')

/**
 * Cross-instance bus: events fan out over a channel per room; presence is a hash of
 * connectionId → member plus a TTL'd alive key per connection, so a dead instance's
 * connections expire on read.
 */
export class RedisRoomBus implements RoomBus {
  private readonly listeners = new Map<string, Set<(raw: string) => void>>()
  private readonly reconnectListeners = new Set<() => void>()
  private connectedOnce = false
  private restoreGeneration = 0
  private readonly restoreChains = new Map<string, Promise<void>>()

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
      this.restoreSubscriptions().then(() => this.notifyReconnect())
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
    try {
      await this.subscriber.subscribe(channel, onMessage)
    } catch (err) {
      set.delete(onMessage)
      if (set.size === 0) this.listeners.delete(channel)
      throw err
    }
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

  // One listener throwing must not cost the others their resync.
  private notifyReconnect(): void {
    for (const listener of this.reconnectListeners) {
      try {
        listener()
      } catch (err) {
        logger.warn({ err: String(err) }, 'reconnect listener threw')
      }
    }
  }

  close(): void {
    this.subscriber.close()
    this.commands.close()
  }

  // Bun keeps the local listener across the reconnect while the server-side SUBSCRIBE is
  // gone; re-subscribing without dropping it first would deliver every message twice.
  // One failed channel must not stop the rest, and listeners always get the resync.
  private async restoreSubscriptions(): Promise<void> {
    const generation = ++this.restoreGeneration
    const restores: Promise<void>[] = []
    for (const [channel, set] of this.listeners) {
      for (const onMessage of set) {
        restores.push(
          this.chained(channel, () =>
            this.subscriber
              .unsubscribe(channel, onMessage)
              .catch(() => {})
              .then(() => this.resubscribe(channel, onMessage, generation)),
          ),
        )
      }
    }
    await Promise.all(restores)
  }

  // Restores of one channel run strictly one after another, so a slow attempt or a retry
  // from an older reconnect can never interleave with, or undo, a newer one.
  private chained(channel: string, task: () => Promise<void>): Promise<void> {
    const next = (this.restoreChains.get(channel) ?? Promise.resolve()).then(task, task)
    this.restoreChains.set(channel, next)
    next.finally(() => {
      if (this.restoreChains.get(channel) === next) this.restoreChains.delete(channel)
    })
    return next
  }

  // Only the first attempt is awaited, so one bad channel neither blocks the others nor
  // holds back the resync. Retries continue in the background with capped backoff for as
  // long as the listener is still wanted: a deaf instance is never an acceptable steady state.
  // A late success resyncs again, because events published while the channel was down
  // are gone for good. A newer restore supersedes pending retries, so a callback is
  // never subscribed twice; a listener dropped meanwhile is never restored.
  private async resubscribe(
    channel: string,
    onMessage: (raw: string) => void,
    generation: number,
    attempt = 1,
  ): Promise<void> {
    const registered = () => this.listeners.get(channel)?.has(onMessage) === true
    if (!registered() || generation !== this.restoreGeneration) return
    try {
      await this.subscriber.subscribe(channel, onMessage)
      if (!registered()) {
        this.subscriber.unsubscribe(channel, onMessage).catch(() => {})
        return
      }
      if (attempt > 1) this.notifyReconnect()
    } catch (err) {
      logger.warn({ err: String(err), channel, attempt }, 'restore failed; retrying')
      void Bun.sleep(Math.min(RESTORE_BACKOFF_MS * attempt, RESTORE_BACKOFF_MAX_MS)).then(() =>
        this.chained(channel, () => this.resubscribe(channel, onMessage, generation, attempt + 1)),
      )
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

  async setStatus(
    roomId: string,
    connectionId: string,
    userId: string,
    status: MemberStatus,
  ): Promise<boolean> {
    const updated = Number(
      await this.commands.eval(
        SET_STATUS_LUA,
        1,
        membersKey(roomId),
        connectionId,
        userId,
        status,
        aliveKey(roomId, ''),
        roomChannel(roomId),
      ),
    )
    return updated === 1
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
