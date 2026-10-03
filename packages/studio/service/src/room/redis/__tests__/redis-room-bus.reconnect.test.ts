import { describe, expect, test } from 'bun:test'
import { fakeRedisClient } from '../__mocks__/fake-redis-client'
import { RedisRoomBus } from '../redis-room-bus'

describe('RedisRoomBus reconnect', () => {
  test('restores every subscription and notifies listeners on a later connect', async () => {
    const sub = fakeRedisClient()
    const cmd = fakeRedisClient()
    const bus = new RedisRoomBus(cmd.client, sub.client)
    let notified = 0
    bus.onReconnect(() => {
      notified += 1
    })
    await bus.subscribe('lobby', () => {})
    await bus.subscribe('lobby', () => {})
    await bus.subscribe('other', () => {})
    expect(sub.calls).toEqual(['room:lobby', 'room:lobby', 'room:other'])

    sub.client.onconnect?.call(sub.client)
    await Bun.sleep(10)
    expect(notified).toBe(0)

    sub.client.onconnect?.call(sub.client)
    await Bun.sleep(10)
    expect(sub.calls.slice(3).sort()).toEqual(['room:lobby', 'room:lobby', 'room:other'])
    expect(notified).toBe(1)
  })

  test('a channel that fails to restore retries in the background, then resyncs again', async () => {
    const sub = fakeRedisClient()
    const bus = new RedisRoomBus(fakeRedisClient().client, sub.client)
    let notified = 0
    bus.onReconnect(() => {
      notified += 1
    })
    await bus.subscribe('lobby', () => {})
    await bus.subscribe('other', () => {})
    ;(sub.client as unknown as { failUntil: number }).failUntil = 3

    sub.client.onconnect?.call(sub.client)
    sub.client.onconnect?.call(sub.client)
    await Bun.sleep(10)
    expect(notified).toBe(1)
    expect(sub.calls.length).toBe(4)

    await Bun.sleep(300)
    expect(sub.calls.length).toBe(5)
    expect(notified).toBe(2)
    expect(sub.calls.slice(2).filter((c) => c === 'room:lobby').length).toBeGreaterThanOrEqual(1)
    expect(sub.calls.slice(2).filter((c) => c === 'room:other').length).toBeGreaterThanOrEqual(1)
  })

  test('a listener dropped while its restore is in flight is not subscribed again', async () => {
    const sub = fakeRedisClient()
    const bus = new RedisRoomBus(fakeRedisClient().client, sub.client)
    const stop = await bus.subscribe('lobby', () => {})
    await bus.subscribe('other', () => {})
    ;(sub.client as unknown as { unsubscribeDelayMs: number }).unsubscribeDelayMs = 20

    sub.client.onconnect?.call(sub.client)
    sub.client.onconnect?.call(sub.client)
    stop()
    await Bun.sleep(60)
    expect(sub.calls.slice(2)).toEqual(['room:other'])
  })

  test('a slow restore from an older reconnect cannot undo the newer one', async () => {
    const sub = fakeRedisClient()
    const bus = new RedisRoomBus(fakeRedisClient().client, sub.client)
    await bus.subscribe('lobby', () => {})
    ;(sub.client as unknown as { subscribeDelayMs: number }).subscribeDelayMs = 30

    sub.client.onconnect?.call(sub.client)
    sub.client.onconnect?.call(sub.client)
    await Bun.sleep(5)
    sub.client.onconnect?.call(sub.client)
    await Bun.sleep(150)
    expect(sub.ops.slice(1)).toEqual([
      'unsub:room:lobby',
      'sub:room:lobby',
      'unsub:room:lobby',
      'sub:room:lobby',
    ])
    expect((bus as unknown as { restoreChains: Map<string, unknown> }).restoreChains.size).toBe(0)
  })

  test('a reconnect listener that throws does not silence the others', async () => {
    const sub = fakeRedisClient()
    const bus = new RedisRoomBus(fakeRedisClient().client, sub.client)
    let notified = 0
    bus.onReconnect(() => {
      throw new Error('boom')
    })
    bus.onReconnect(() => {
      notified += 1
    })
    sub.client.onconnect?.call(sub.client)
    sub.client.onconnect?.call(sub.client)
    await Bun.sleep(10)
    expect(notified).toBe(1)
  })

  test('a retry left over from an older restore is dropped once a newer restore succeeds', async () => {
    const sub = fakeRedisClient()
    const bus = new RedisRoomBus(fakeRedisClient().client, sub.client)
    let notified = 0
    bus.onReconnect(() => {
      notified += 1
    })
    await bus.subscribe('lobby', () => {})
    await bus.subscribe('other', () => {})
    ;(sub.client as unknown as { failUntil: number }).failUntil = 3

    sub.client.onconnect?.call(sub.client)
    sub.client.onconnect?.call(sub.client)
    await Bun.sleep(10)
    expect(notified).toBe(1)
    sub.client.onconnect?.call(sub.client)
    await Bun.sleep(10)
    expect(notified).toBe(2)
    expect(sub.calls.length).toBe(6)

    await Bun.sleep(300)
    expect(sub.calls.length).toBe(6)
    expect(notified).toBe(2)
  })
})
