import { ROOM_ID } from '../constants'
import { useCurrentUser } from './use-current-user'
import { useRoomStream } from './use-room-stream'
import { useSendMessage } from './use-send-message'

export function useChatExample() {
  const { data: currentUser } = useCurrentUser()
  const room = useRoomStream(ROOM_ID, currentUser?.id)
  const sender = useSendMessage(ROOM_ID)

  return {
    currentUser,
    messages: room.messages,
    members: room.members,
    connectionStatus: room.connectionStatus,
    // Joined but no snapshot yet: the room is loading, not empty.
    isLoading:
      Boolean(currentUser) && !room.connectionId && room.connectionStatus !== 'disconnected',
    send: sender.send,
    isSending: sender.isPending,
    sendError: sender.error,
  }
}
