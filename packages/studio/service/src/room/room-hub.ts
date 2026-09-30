import { createLogger } from '@temp-repo/logger'
import type { ChatMessage, Member, RoomEvent } from '@temp-repo/studio-domain'
import { CACHE_URL, createCacheClient } from '@temp-repo/studio-repository'
import { getChatMessages } from '../queries/chat'
import { HEARTBEAT_MS } from './constants'
import { LocalRoomBus } from './local-room-bus'
import { RedisRoomBus } from './redis-room-bus'
import type { RoomBus } from './types'
import { createAsyncQueue, presenceSignature } from './utils'

const logger = createLogger('room')

/** Room lifecycle on top of a bus: join → sync → live events + heartbeat → leave. */
export class RoomHub {
  constructor(
    readonly bus: RoomBus,
    private readonly loadHistory: () => Promise<ChatMessage[]> = getChatMessages,
  ) {}

  async *stream(roomId: string, member: Member, signal?: AbortSignal): AsyncGenerator<RoomEvent> {
    const connectionId = crypto.randomUUID()
    const queue = createAsyncQueue<RoomEvent>(signal)
    const unsubscribe = await this.bus.subscribe(roomId, (event) => queue.push(event))
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
      const messages = await this.loadHistory()
      const members = await this.bus.members(roomId)
      if (signal?.aborted) return
      signature = presenceSignature(members)
      // Everything queued up to this point may already be in the snapshot (this member's own
      // join, joins of listed users, chats in history); those copies are echoes. Anything that
      // arrives while the consumer holds the sync event is real and passes.
      const snapshotUsers = new Set(members.map((m) => m.userId))
      const snapshotMessages = new Set(messages.map((m) => m.id))
      let backlog = queue.size()
      yield { type: 'sync', members, messages }
      for await (const event of queue) {
        if (backlog > 0) {
          backlog -= 1
          if (event.type === 'join' && snapshotUsers.has(event.member.userId)) continue
          if (event.type === 'chat' && snapshotMessages.has(event.message.id)) continue
        }
        yield event
      }
    } finally {
      closing = true
      clearInterval(tick)
      unsubscribe()
      // A heartbeat still in flight would re-assert the record after the leave.
      await inFlight
      if (joined) await this.bus.leave(roomId, connectionId)
    }
  }

  chat(roomId: string, message: ChatMessage): Promise<void> {
    return this.bus.publish(roomId, { type: 'chat', message })
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

// One hub per process, not per module graph: dev evaluates the HTTP route (Vite `ssr` env)
// and the WebSocket handler (`nitro` env) separately, and HMR re-evaluates modules.
const HUB_KEY = Symbol.for('studio.room-hub')
const globalHub = globalThis as typeof globalThis & Record<symbol, RoomHub | undefined>
globalHub[HUB_KEY] ??= new RoomHub(createBus())

export const hub: RoomHub = globalHub[HUB_KEY]
