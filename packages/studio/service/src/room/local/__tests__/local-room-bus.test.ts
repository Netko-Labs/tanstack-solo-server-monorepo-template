import { describe, expect, test } from 'bun:test'
import type { RoomEvent } from '@temp-repo/studio-domain'
import { LocalRoomBus } from '../local-room-bus'

const leave: RoomEvent = { type: 'leave', userId: 'u1' }

describe('LocalRoomBus publish', () => {
  test('a throwing listener neither rejects the publish nor starves the next listener', async () => {
    const bus = new LocalRoomBus()
    const seen: RoomEvent[] = []
    await bus.subscribe('lobby', () => {
      throw new Error('listener down')
    })
    await bus.subscribe('lobby', (event) => seen.push(event))
    await expect(bus.publish('lobby', leave)).resolves.toBeUndefined()
    expect(seen).toEqual([leave])
  })
})
