import { describe, expect, test } from 'bun:test'
import type { RedisClient } from 'bun'
import { RedisRoomBus } from './redis-room-bus'

/** Just enough of RedisClient for the subscriber side: records every SUBSCRIBE. */
function fakeSubscriber() {
  const calls: string[] = []
  const client = {
    onconnect: null as (() => void) | null,
    onclose: null as ((error: Error) => void) | null,
    failUntil: 0,
    async subscribe(channel: string) {
      calls.push(channel)
      if (calls.length <= this.failUntil) throw new Error('SUBSCRIBE refused')
      return 1
    },
    async unsubscribe() {},
    close() {},
  }
  return { client: client as unknown as RedisClient, calls }
}

describe('RedisRoomBus reconnect', () => {
  test('restores every subscription and notifies listeners on a later connect', async () => {
    const sub = fakeSubscriber()
    const cmd = fakeSubscriber()
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

  test('a channel that fails to restore keeps retrying without holding back the resync', async () => {
    const sub = fakeSubscriber()
    const bus = new RedisRoomBus(fakeSubscriber().client, sub.client)
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
    expect(sub.calls.slice(2).filter((c) => c === 'room:lobby').length).toBeGreaterThanOrEqual(1)
    expect(sub.calls.slice(2).filter((c) => c === 'room:other').length).toBeGreaterThanOrEqual(1)
  })
})
