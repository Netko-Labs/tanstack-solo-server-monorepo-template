import type { FormEvent } from 'react'
import { trpcClient } from '@/integrations/trpc'
import { useAutoScroll } from './use-auto-scroll'
import { useCurrentUser } from './use-current-user'
import { useRoomStream } from './use-room-stream'

const ROOM_ID = 'lobby'

export function useChatExample() {
  const { data: currentUser } = useCurrentUser()
  const { messages, members, connectionStatus } = useRoomStream(ROOM_ID, currentUser?.id)
  const messagesEndRef = useAutoScroll(messages.length)

  const handleSendMessage = (e: FormEvent, content: string) => {
    e.preventDefault()
    if (!content.trim() || !currentUser) return
    trpcClient.room.send.mutate({ roomId: ROOM_ID, content })
  }

  return {
    currentUser,
    messages,
    members,
    isLoading: false,
    connectionStatus,
    messagesEndRef,
    sendMutation: { isPending: false },
    handleSendMessage,
  }
}
