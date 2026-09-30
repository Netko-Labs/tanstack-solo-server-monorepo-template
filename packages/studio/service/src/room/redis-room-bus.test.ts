import { describe, expect, test } from 'bun:test'
import type { Member, RoomEvent } from '@temp-repo/studio-domain'
import { RedisRoomBus } from './redis-room-bus'

const url = process.env.CACHE_URL ?? ''
const member: Member = { userId: 'u1', name: 'one', status: 'active' }
const client = () => new Bun.RedisClient(url)

const until = async (check: () => boolean, ms = 3000) => {
  const deadline = Date.now() + ms
  while (!check()) {
    if (Date.now() > deadline) throw new Error('timeout')
    await Bun.sleep(10)
  }
}

describe.skipIf(!url)('RedisRoomBus across two instances', () => {
  test('publish on A reaches a subscriber on B; presence is shared and per connection', async () => {
    const a = new RedisRoomBus(client(), client())
    const b = new RedisRoomBus(client(), client())
    const room = `test-${crypto.randomUUID()}`
    const seen: RoomEvent[] = []
    const off = await b.subscribe(room, (event) => seen.push(event))
    try {
      await a.join(room, 'c1', member)
      await until(() => seen.some((e) => e.type === 'join'))
      expect((await b.members(room)).map((m) => m.userId)).toEqual(['u1'])

      await a.join(room, 'c2', member)
      expect(await a.setStatus(room, 'c1', 'intruder', 'idle')).toBe(false)
      expect(await a.setStatus(room, 'c1', member.userId, 'idle')).toBe(true)
      await until(() => seen.some((e) => e.type === 'presence'))
      expect((await b.members(room))[0]?.status).toBe('active')
      expect(await a.setStatus(room, 'c2', member.userId, 'idle')).toBe(true)
      expect((await b.members(room))[0]?.status).toBe('idle')
      await a.heartbeat(room, 'c1', { ...member, name: 'renamed' })
      await a.heartbeat(room, 'c2', { ...member, name: 'renamed' })
      expect((await b.members(room))[0]).toEqual({ ...member, name: 'renamed', status: 'idle' })

      expect(await a.leave(room, 'c1')).toBe(false)
      expect((await b.members(room)).map((m) => m.userId)).toEqual(['u1'])
      expect(await a.leave(room, 'c2')).toBe(true)
      await until(() => seen.some((e) => e.type === 'leave'))
      expect(await b.members(room)).toEqual([])
    } finally {
      off()
      a.close()
      b.close()
    }
  })

  test('a killed subscriber connection is restored and delivers exactly once', async () => {
    const commands = client()
    const subscriber = client()
    const bus = new RedisRoomBus(commands, subscriber)
    const room = `test-${crypto.randomUUID()}`
    const got: RoomEvent[] = []
    try {
      const subscriberId = String(await subscriber.send('CLIENT', ['ID']))
      const off = await bus.subscribe(room, (event) => got.push(event))
      const reconnected = new Promise<void>((resolve) => bus.onReconnect(resolve))
      // Kills only this test's subscriber socket; Bun reconnects, the bus must re-SUBSCRIBE.
      await commands.send('CLIENT', ['KILL', 'ID', subscriberId])
      await reconnected
      await bus.publish(room, { type: 'leave', userId: 'x' })
      await until(() => got.length > 0)
      await Bun.sleep(100)
      expect(got).toHaveLength(1)
      off()
    } finally {
      bus.close()
    }
  })
})
