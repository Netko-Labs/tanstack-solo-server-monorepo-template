import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChatMessage } from '@temp-repo/studio-domain'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { trpcClient, useTRPC } from '@/integrations/trpc'
import { scrollIntoView } from '@/lib/dom-events'
import type { ChatEvent, ConnectionStatus } from './definitions'
import { appendUniqueChatMessage } from './lib/utils'

export function useChatExample() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: currentUser } = useQuery({
    ...trpc.auth.me.queryOptions(),
    retry: false,
  })

  const { data: messages = [], isLoading } = useQuery(trpc.chat.messages.queryOptions())

  const sendMutation = useMutation(
    trpc.chat.sendMessage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.chat.messages.queryKey() })
      },
    }),
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when message count changes
  useEffect(() => {
    scrollIntoView(messagesEndRef, { behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    setConnectionStatus('connecting')

    const unsubscribe = trpcClient.chat.onMessage.subscribe(undefined, {
      onData: (data: ChatEvent) => {
        if (data.type === 'init') {
          queryClient.setQueryData(trpc.chat.messages.queryKey(), data.messages)
          setConnectionStatus('connected')
        } else if (data.type === 'message') {
          queryClient.setQueryData(trpc.chat.messages.queryKey(), (old: ChatMessage[] = []) =>
            appendUniqueChatMessage(old, data.message),
          )
        }
      },
      onError: (err: unknown) => {
        console.error('SSE subscription error:', err)
        setConnectionStatus('disconnected')
      },
    })

    return () => {
      unsubscribe.unsubscribe()
      setConnectionStatus('disconnected')
    }
  }, [queryClient, trpc.chat.messages])

  const handleSendMessage = (e: FormEvent, content: string) => {
    e.preventDefault()
    if (!content.trim() || !currentUser) return

    sendMutation.mutate({ content })
  }

  return {
    currentUser,
    messages,
    isLoading,
    connectionStatus,
    messagesEndRef,
    sendMutation,
    handleSendMessage,
  }
}
