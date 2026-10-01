import { expect, test } from 'bun:test'
import { RoomIdSchema } from './room'

test('a room id is lowercase, dashed and at most 64 characters', () => {
  expect(RoomIdSchema.safeParse('lobby').success).toBe(true)
  expect(RoomIdSchema.safeParse('team-42').success).toBe(true)
  expect(RoomIdSchema.safeParse('a'.repeat(64)).success).toBe(true)

  for (const bad of ['', 'Lobby', 'room:1', 'a b', 'a'.repeat(65)]) {
    expect(RoomIdSchema.safeParse(bad).success).toBe(false)
  }
})
