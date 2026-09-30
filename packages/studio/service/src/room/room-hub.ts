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
    let signature = ''

    const tick = setInterval(() => {
      this.bus
        .heartbeat(roomId, connectionId, member)
        .then(() => this.bus.members(roomId))
        .then((members) => {
          const next = presenceSignature(members)
          if (next === signature) return
          signature = next
          queue.push({ type: 'presence', members })
        })
        .catch((err) => logger.warn({ err: String(err), roomId }, 'heartbeat failed'))
    }, HEARTBEAT_MS)

    try {
      await this.bus.join(roomId, connectionId, member)
      joined = true
      const members = await this.bus.members(roomId)
      signature = presenceSignature(members)
      yield { type: 'sync', members, messages: await this.loadHistory() }
      // The snapshot already lists this member; the join queued before it is an echo.
      let ownJoinPending = true
      for await (const event of queue) {
        if (ownJoinPending && event.type === 'join' && event.member.userId === member.userId) {
          ownJoinPending = false
          continue
        }
        yield event
      }
    } finally {
      clearInterval(tick)
      unsubscribe()
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
