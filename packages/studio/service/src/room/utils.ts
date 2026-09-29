import { type Member, type RoomEvent, RoomEventSchema } from '@temp-repo/studio-domain'
import superjson from 'superjson'
import { IDLE_AFTER_MS, PRESENCE_TTL_S, ROOM_KEY_PREFIX } from './constants'
import type { AsyncQueue } from './types'

export const roomChannel = (roomId: string) => `${ROOM_KEY_PREFIX}:${roomId}`
export const membersKey = (roomId: string) => `${ROOM_KEY_PREFIX}:${roomId}:members`
export const aliveKey = (roomId: string, userId: string) =>
  `${ROOM_KEY_PREFIX}:${roomId}:alive:${userId}`

export const serializeEvent = (event: RoomEvent): string => superjson.stringify(event)

export function parseEvent(raw: string): RoomEvent | undefined {
  const parsed = RoomEventSchema.safeParse(superjson.parse(raw))
  return parsed.success ? parsed.data : undefined
}

export const isExpired = (lastSeen: number, now: number): boolean =>
  now - lastSeen > PRESENCE_TTL_S * 1000

export const withStatus = (member: Member, lastSeen: number, now: number): Member => ({
  ...member,
  status: now - lastSeen > IDLE_AFTER_MS ? 'idle' : 'active',
})

export const presenceSignature = (members: Member[]): string =>
  members
    .map((m) => `${m.userId}:${m.status}`)
    .sort()
    .join(',')

/** Push-driven queue: consumers await the next item instead of polling. */
export function createAsyncQueue<T>(signal?: AbortSignal): AsyncQueue<T> {
  const items: T[] = []
  let wake: (() => void) | undefined
  const notify = () => {
    wake?.()
    wake = undefined
  }
  signal?.addEventListener('abort', notify, { once: true })
  return {
    push(item) {
      items.push(item)
      notify()
    },
    async *[Symbol.asyncIterator]() {
      while (!signal?.aborted) {
        const next = items.shift()
        if (next !== undefined) {
          yield next
          continue
        }
        await new Promise<void>((resolve) => {
          wake = resolve
        })
      }
    },
  }
}
