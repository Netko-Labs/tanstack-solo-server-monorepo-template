import { describe, expect, test } from 'bun:test'
import { member } from '../__mocks__/member'
import { msg } from '../__mocks__/msg'
import { INITIAL_ROOM_STATE, roomReducer } from '../utils'

describe('roomReducer', () => {
  test('sync replaces, chat dedupes, joins upsert, leave removes, a later sync wins', () => {
    let state = roomReducer(INITIAL_ROOM_STATE, {
      type: 'reset',
      identity: 'lobby:a',
      connectionStatus: 'connecting',
    })
    state = roomReducer(state, {
      type: 'event',
      event: { type: 'sync', connectionId: 'c1', members: [member('a')], messages: [msg('1')] },
    })
    expect(state.connectionStatus).toBe('connected')
    expect(state.connectionId).toBe('c1')

    state = roomReducer(state, { type: 'event', event: { type: 'chat', message: msg('1') } })
    expect(state.messages).toHaveLength(1)
    state = roomReducer(state, { type: 'event', event: { type: 'join', member: member('b') } })
    state = roomReducer(state, {
      type: 'event',
      event: { type: 'join', member: member('b', 'idle') },
    })
    expect(state.members).toEqual([member('a'), member('b', 'idle')])
    state = roomReducer(state, { type: 'event', event: { type: 'leave', userId: 'a' } })
    expect(state.members.map((m) => m.userId)).toEqual(['b'])
    state = roomReducer(state, { type: 'status', connectionStatus: 'connecting' })
    state = roomReducer(state, {
      type: 'event',
      event: {
        type: 'sync',
        connectionId: 'c2',
        members: [member('b')],
        messages: [msg('1'), msg('2')],
      },
    })
    expect(state.messages.map((m) => m.id)).toEqual(['1', '2'])
    expect(state.connectionStatus).toBe('connected')
  })
})
