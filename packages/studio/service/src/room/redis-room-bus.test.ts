import { describe, expect, test } from 'bun:test'
import type { Member, RoomEvent } from '@temp-repo/studio-domain'
import { RedisRoomBus } from './redis-room-bus'

const url = process.env.CACHE_URL ?? ''
const member: Member = { userId: 'u1', name: 'one', status: 'active' }
const client = () => new Bun.RedisClient(url)

const waitFor = <T>(ready: (resolve: (value: T) => void) => void, ms = 2000) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    ready((value) => {
      clearTimeout(timer)
      resolve(value)
    })
  })

describe.skipIf(!url)('RedisRoomBus across two instances', () => {
  test('publish on A reaches a subscriber on B; presence is shared', async () => {
    const a = new RedisRoomBus(client(), client())
    const b = new RedisRoomBus(client(), client())
    const room = `test-${crypto.randomUUID()}`

    const received = waitFor<RoomEvent>((resolve) => {
      b.subscribe(room, resolve)
    })
    await Bun.sleep(100)
    await a.join(room, member)
    expect(await received).toEqual({ type: 'join', member })
    expect((await b.members(room)).map((m) => m.userId)).toEqual(['u1'])

    await a.leave(room, member.userId)
    await Bun.sleep(100)
    expect(await b.members(room)).toEqual([])
  })
})
