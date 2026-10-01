import { createLogger } from '@temp-repo/logger'
import type { ChatMessage, Member, RoomEvent } from '@temp-repo/studio-domain'
import { getChatMessages } from '../queries/chat'
import { HEARTBEAT_MS } from './constants'
import { createRoomBus } from './create-room-bus'
import type { MemberStatus, RoomBus, RoomQueueItem, RoomSync } from './types'
import { createAsyncQueue, presenceSignature } from './utils'

const logger = createLogger('room')

/** Room lifecycle on top of a bus: join → sync → live events + heartbeat → leave. */
export class RoomHub {
  private activeStreams = 0

  constructor(
    readonly bus: RoomBus,
    private readonly loadHistory: (roomId: string) => Promise<ChatMessage[]> = getChatMessages,
    private readonly heartbeatMs: number = HEARTBEAT_MS,
  ) {}

  /**
   * `until` ends the stream when the caller's session expires, so a revoked or expired
   * login cannot keep a live channel open past its lifetime.
   */
  async *stream(
    roomId: string,
    member: Member,
    signal?: AbortSignal,
    until?: Date,
  ): AsyncGenerator<RoomEvent> {
    const connectionId = crypto.randomUUID()
    const controller = new AbortController()
    if (signal?.aborted) controller.abort()
    else signal?.addEventListener('abort', () => controller.abort(), { once: true })
    const queue = createAsyncQueue<RoomQueueItem>(controller.signal)
    // Counted before the subscribe resolves so a drain sees streams still on their way in;
    // a failed subscribe throws before the `finally` below exists, so it uncounts itself.
    this.activeStreams += 1
    let unsubscribe: () => void
    try {
      unsubscribe = await this.bus.subscribe(roomId, (event) => queue.push(event))
    } catch (err) {
      this.activeStreams -= 1
      throw err
    }
    const deadline = until
      ? setTimeout(() => controller.abort(), Math.max(0, until.getTime() - Date.now()))
      : undefined
    // Events lost in an outage need a fresh snapshot, queued as a marker to keep event order
    // (docs/room-bus.md, snapshot boundary).
    const offReconnect = this.bus.onReconnect(() => queue.push({ type: 'resync' }))
    let joined = false
    let closing = false
    let inFlight: Promise<void> | undefined
    let signature = ''

    // One heartbeat at a time: a slow one skips the next tick instead of overlapping it,
    // so cleanup only ever has a single promise to wait for.
    const tick = setInterval(() => {
      if (closing || inFlight) return
      inFlight = this.bus
        .heartbeat(roomId, connectionId, member)
        .then(() => this.bus.members(roomId))
        .then((members) => {
          const next = presenceSignature(members)
          if (next === signature) return
          signature = next
          queue.push({ type: 'presence', members })
        })
        .catch((err) => logger.warn({ err: String(err), roomId }, 'heartbeat failed'))
        .finally(() => {
          inFlight = undefined
        })
    }, this.heartbeatMs)

    try {
      if (controller.signal.aborted) return
      await this.bus.join(roomId, connectionId, member)
      joined = true
      let sync = await this.snapshot(roomId, connectionId)
      if (controller.signal.aborted) return
      signature = presenceSignature(sync.members)
      // Backlog joins of listed users are echoes; a chat already in a snapshot is suppressed for
      // the stream's lifetime, since its notification may trail the history read.
      let snapshotUsers = new Set(sync.members.map((m) => m.userId))
      const seenMessages = new Set(sync.messages.map((m) => m.id))
      let backlog = queue.size()
      yield sync
      for await (const item of queue) {
        if (item.type === 'resync') {
          sync = await this.snapshot(roomId, connectionId)
          signature = presenceSignature(sync.members)
          snapshotUsers = new Set(sync.members.map((m) => m.userId))
          for (const m of sync.messages) seenMessages.add(m.id)
          backlog = queue.size()
          yield sync
          continue
        }
        if (item.type === 'chat' && seenMessages.has(item.message.id)) continue
        if (backlog > 0) {
          backlog -= 1
          if (item.type === 'join' && snapshotUsers.has(item.member.userId)) continue
        }
        yield item
      }
    } finally {
      closing = true
      clearInterval(tick)
      clearTimeout(deadline)
      offReconnect()
      unsubscribe()
      // A heartbeat still in flight would re-assert the record after the leave.
      await inFlight
      try {
        if (joined) await this.bus.leave(roomId, connectionId)
      } finally {
        this.activeStreams -= 1
      }
    }
  }

  /** Resolves once every stream has run its leave, or after `timeoutMs`. */
  async drain(timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs
    while (this.activeStreams > 0 && Date.now() < deadline) await Bun.sleep(25)
  }

  chat(roomId: string, message: ChatMessage): Promise<void> {
    return this.bus.publish(roomId, { type: 'chat', message })
  }

  setStatus(
    roomId: string,
    connectionId: string,
    userId: string,
    status: MemberStatus,
  ): Promise<boolean> {
    return this.bus.setStatus(roomId, connectionId, userId, status)
  }

  private async snapshot(roomId: string, connectionId: string): Promise<RoomSync> {
    const messages = await this.loadHistory(roomId)
    const members = await this.bus.members(roomId)
    return { type: 'sync', connectionId, members, messages }
  }

  members(roomId: string): Promise<Member[]> {
    return this.bus.members(roomId)
  }
}

// One bus per process, not per module graph: dev evaluates the HTTP route and the WebSocket
// handler separately (docs/room-bus.md, dev gotcha). The stateless hub is rebuilt each time.
const BUS_KEY = Symbol.for('studio.room-bus')
const globalBus = globalThis as typeof globalThis & Record<symbol, RoomBus | undefined>
globalBus[BUS_KEY] ??= createRoomBus()

export const hub = new RoomHub(globalBus[BUS_KEY])
