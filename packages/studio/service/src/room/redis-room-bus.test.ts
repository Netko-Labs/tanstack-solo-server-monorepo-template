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

    let unsubscribe = () => {}
    const received = waitFor<RoomEvent>((resolve) => {
      b.subscribe(room, resolve).then((off) => {
        unsubscribe = off
      })
    })
    await Bun.sleep(50)
    await a.join(room, 'c1', member)
    expect(await received).toEqual({ type: 'join', member })
    expect((await b.members(room)).map((m) => m.userId)).toEqual(['u1'])

    await a.join(room, 'c2', member)
    expect(await a.setStatus(room, 'c1', 'intruder', 'idle')).toBe(false)
    const presence = waitFor<RoomEvent>((resolve) => {
      b.subscribe(room, (event) => {
        if (event.type === 'presence') resolve(event)
      })
    })
    await Bun.sleep(50)
    expect(await a.setStatus(room, 'c1', member.userId, 'idle')).toBe(true)
    const snapshot = await presence
    if (snapshot.type !== 'presence') throw new Error('unreachable')
    expect(snapshot.members).toEqual([member])
    expect((await b.members(room))[0]?.status).toBe('active')
    expect(await a.setStatus(room, 'c2', member.userId, 'idle')).toBe(true)
    expect((await b.members(room))[0]?.status).toBe('idle')
    await a.heartbeat(room, 'c1', { ...member, name: 'renamed' })
    await a.heartbeat(room, 'c2', { ...member, name: 'renamed' })
    expect((await b.members(room))[0]).toEqual({ ...member, name: 'renamed', status: 'idle' })
    expect(await a.leave(room, 'c1')).toBe(false)
    expect((await b.members(room)).map((m) => m.userId)).toEqual(['u1'])
    expect(await a.leave(room, 'c2')).toBe(true)
    unsubscribe()
    await Bun.sleep(100)
    expect(await b.members(room)).toEqual([])
  })
})
