import { describe, expect, test } from 'bun:test'
import { member } from '../__mocks__/member'
import { LocalRoomBus } from '../local'
import { RoomHub } from '../room-hub'

describe('RoomHub session deadline', () => {
  test('an `until` deadline ends a live stream and removes the member from presence', async () => {
    const hub = new RoomHub(new LocalRoomBus(), async () => [])
    const stream = hub.stream('lobby', member('a'), undefined, new Date(Date.now() + 50))
    const sync = await stream.next()
    expect(sync.value?.type).toBe('sync')
    expect((await hub.members('lobby')).map((m) => m.userId)).toEqual(['a'])

    const started = Date.now()
    expect((await stream.next()).done).toBe(true)
    expect(Date.now() - started).toBeLessThan(200)
    expect(await hub.members('lobby')).toEqual([])
  })

  test('an `until` already in the past ends the stream without a sync', async () => {
    const bus = new LocalRoomBus()
    const hub = new RoomHub(bus, async () => [])
    const joins: string[] = []
    await bus.subscribe('lobby', (event) => {
      if (event.type === 'join') joins.push(event.member.userId)
    })
    const stream = hub.stream('lobby', member('a'), undefined, new Date(Date.now() - 1_000))
    expect((await stream.next()).done).toBe(true)
    expect(joins).toEqual([])
    expect(await hub.members('lobby')).toEqual([])
  })
})
