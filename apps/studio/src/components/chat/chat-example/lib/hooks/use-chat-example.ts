import { useQuery } from '@tanstack/react-query'
import type { ChatMessage, Member } from '@temp-repo/realtime-domain'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { realtime } from '@/integrations/realtime'
import { useTRPC } from '@/integrations/trpc'
import { scrollIntoView } from '@/shared/dom-events'
import type { ConnectionStatus } from '../types'
import { appendUniqueChatMessage } from '../utils'

const ROOM_ID = 'lobby'

export function useChatExample() {
  const trpc = useTRPC()
  const { data: currentUser } = useQuery({ ...trpc.auth.me.queryOptions(), retry: false })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when message count changes
  useEffect(() => {
    scrollIntoView(messagesEndRef, { behavior: 'smooth' })
  }, [messages.length])

  // biome-ignore lint/correctness/useExhaustiveDependencies: reconnect only when the user changes
  useEffect(() => {
    if (!currentUser) {
      setConnectionStatus('disconnected')
      return
    }
    setConnectionStatus('connecting')
    const sub = realtime.room.stream.subscribe(
      { roomId: ROOM_ID },
      {
        onData: (event) => {
          setConnectionStatus('connected')
          if (event.type === 'sync') {
            setMessages(event.messages)
            setMembers(event.members)
          } else if (event.type === 'chat') {
            setMessages((m) => appendUniqueChatMessage(m, event.message))
          } else if (event.type === 'presence') {
            setMembers(event.members)
          } else if (event.type === 'join') {
            setMembers((m) => [...m.filter((x) => x.userId !== event.member.userId), event.member])
          } else if (event.type === 'leave') {
            setMembers((m) => m.filter((x) => x.userId !== event.userId))
          }
        },
        onError: () => setConnectionStatus('disconnected'),
        onComplete: () => setConnectionStatus('disconnected'),
      },
    )
    return () => sub.unsubscribe()
  }, [currentUser?.id])

  const handleSendMessage = (e: FormEvent, content: string) => {
    e.preventDefault()
    if (!content.trim() || !currentUser) return
    realtime.room.send.mutate({ roomId: ROOM_ID, content })
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
