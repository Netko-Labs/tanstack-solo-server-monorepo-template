import { describe, expect, test } from 'bun:test'
import type { RoomEvent } from '@temp-repo/studio-domain'
import { parseEvent, serializeEvent } from './utils'

describe('room event wire format', () => {
  test('round-trips events and ignores garbage', () => {
    const event: RoomEvent = {
      type: 'chat',
      message: {
        id: crypto.randomUUID(),
        roomId: 'lobby',
        content: 'hi',
        authorId: 'a',
        authorName: 'a',
        createdAt: new Date(),
      },
    }
    expect(parseEvent(serializeEvent(event))).toEqual(event)
    expect(parseEvent('not json')).toBeUndefined()
    expect(parseEvent('{"json":{"type":"nope"}}')).toBeUndefined()
  })
})
