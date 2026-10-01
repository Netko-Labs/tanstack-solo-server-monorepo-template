import { useLoaderData } from '@tanstack/react-router'
import { useSessionUser } from '@/components/shared/session'
import { ROOM_ID } from '../constants'
import { useRoomStream } from './use-room-stream'
import { useSendMessage } from './use-send-message'

export function useChatExample() {
  const { user: initialUser } = useLoaderData({ from: '/chat' })
  const { user: currentUser, isPending } = useSessionUser(initialUser)
  const room = useRoomStream(ROOM_ID, currentUser?.id)
  const sender = useSendMessage(ROOM_ID)

  return {
    currentUser,
    isSessionPending: isPending,
    messages: room.messages,
    members: room.members,
    connectionStatus: room.connectionStatus,
    // Joined but no snapshot yet: the room is loading, not empty.
    isLoading:
      Boolean(currentUser) && !room.connectionId && room.connectionStatus !== 'disconnected',
    sender,
  }
}
