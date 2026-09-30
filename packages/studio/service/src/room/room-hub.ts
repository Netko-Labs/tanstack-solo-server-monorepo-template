import { createLogger } from '@temp-repo/logger'
import type { ChatMessage, Member, RoomEvent } from '@temp-repo/studio-domain'
import { CACHE_URL, createCacheClient } from '@temp-repo/studio-repository'
import { getChatMessages } from '../queries/chat'
import { HEARTBEAT_MS } from './constants'
import { LocalRoomBus } from './local-room-bus'
import { RedisRoomBus } from './redis-room-bus'
import type { MemberStatus, RoomBus } from './types'
import { createAsyncQueue, presenceSignature } from './utils'

type Sync = Extract<RoomEvent, { type: 'sync' }>
/** Queue items: room events plus an internal marker asking the consumer to take a fresh snapshot. */
type QueueItem = RoomEvent | { type: 'resync' }

const logger = createLogger('room')

/** Room lifecycle on top of a bus: join → sync → live events + heartbeat → leave. */
export class RoomHub {
  constructor(
    readonly bus: RoomBus,
    private readonly loadHistory: () => Promise<ChatMessage[]> = getChatMessages,
  ) {}

  async *stream(roomId: string, member: Member, signal?: AbortSignal): AsyncGenerator<RoomEvent> {
    const connectionId = crypto.randomUUID()
    const queue = createAsyncQueue<QueueItem>(signal)
    const unsubscribe = await this.bus.subscribe(roomId, (event) => queue.push(event))
    // After a transport reconnect the client re-syncs from a fresh snapshot: events published
    // during the outage are gone for good, so a diff cannot repair the view. The marker keeps
    // queue order: the snapshot is taken when the consumer reaches it, so events queued after
    // it are deduped against that snapshot instead of being wiped by it.
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
    }, HEARTBEAT_MS)

    try {
      await this.bus.join(roomId, connectionId, member)
      joined = true
      let sync = await this.snapshot(roomId, connectionId)
      if (signal?.aborted) return
      signature = presenceSignature(sync.members)
      // Joins queued before a snapshot for users it already lists are echoes (a later rejoin
      // is real, so this is backlog-scoped). Chat ids are immutable, so any chat already in a
      // snapshot is suppressed for the stream's lifetime: its notification may trail the
      // history read by more than the backlog window.
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
      offReconnect()
      unsubscribe()
      // A heartbeat still in flight would re-assert the record after the leave.
      await inFlight
      if (joined) await this.bus.leave(roomId, connectionId)
    }
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

  private async snapshot(roomId: string, connectionId: string): Promise<Sync> {
    const messages = await this.loadHistory()
    const members = await this.bus.members(roomId)
    return { type: 'sync', connectionId, members, messages }
  }

  members(roomId: string): Promise<Member[]> {
    return this.bus.members(roomId)
  }
}

function createBus(): RoomBus {
  if (!CACHE_URL) return new LocalRoomBus()
  logger.info('room bus: redis')
  return new RedisRoomBus(createCacheClient(), createCacheClient())
}

// The bus (connections + subscriptions + presence) is one per process, not per module
// graph: dev evaluates the HTTP route (Vite `ssr` env) and the WebSocket handler (`nitro`
// env) separately. The hub is stateless, so every module evaluation builds a fresh one on
// the shared bus and HMR edits to this file take effect without a restart; edits to the
// bus files still need one.
const BUS_KEY = Symbol.for('studio.room-bus')
const globalBus = globalThis as typeof globalThis & Record<symbol, RoomBus | undefined>
globalBus[BUS_KEY] ??= createBus()

export const hub = new RoomHub(globalBus[BUS_KEY])
