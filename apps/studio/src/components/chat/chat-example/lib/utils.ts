import type { ChatMessage, Member } from '@temp-repo/studio-domain'
import type { RoomAction, RoomState } from './types'

export function appendUniqueChatMessage(messages: ChatMessage[], message: ChatMessage) {
  if (messages.some((entry) => entry.id === message.id)) {
    return messages
  }

  return [...messages, message]
}

const upsertMember = (members: Member[], member: Member): Member[] => [
  ...members.filter((entry) => entry.userId !== member.userId),
  member,
]

export const INITIAL_ROOM_STATE: RoomState = {
  identity: '',
  messages: [],
  members: [],
  connectionStatus: 'connecting',
}

export const roomIdentity = (roomId: string, userId: string | undefined): string =>
  `${roomId}:${userId ?? ''}`

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'reset':
      return {
        ...INITIAL_ROOM_STATE,
        identity: action.identity,
        connectionStatus: action.connectionStatus,
      }
    case 'status':
      return { ...state, connectionStatus: action.connectionStatus }
    case 'event': {
      const { event } = action
      const live = { ...state, connectionStatus: 'connected' as const }
      switch (event.type) {
        case 'sync':
          return {
            ...live,
            connectionId: event.connectionId,
            messages: event.messages,
            members: event.members,
          }
        case 'chat':
          return { ...live, messages: appendUniqueChatMessage(live.messages, event.message) }
        case 'presence':
          return { ...live, members: event.members }
        case 'join':
          return { ...live, members: upsertMember(live.members, event.member) }
        case 'leave':
          return { ...live, members: live.members.filter((m) => m.userId !== event.userId) }
      }
    }
  }
}
