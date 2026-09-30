import { describe, expect, test } from 'bun:test'
import type { RedisClient } from 'bun'
import { RedisRoomBus } from './redis-room-bus'

/** Just enough of RedisClient for the subscriber side: records every SUBSCRIBE. */
function fakeSubscriber() {
  const calls: string[] = []
  const client = {
    onconnect: null as (() => void) | null,
    onclose: null as ((error: Error) => void) | null,
    async subscribe(channel: string) {
      calls.push(channel)
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
})
