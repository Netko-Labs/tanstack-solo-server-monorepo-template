import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChatMessage } from '@temp-repo/studio-domain'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { trpcClient, useTRPC } from '@/integrations/trpc'

interface ChatInitEvent {
  id: string
  type: 'init'
  messages: ChatMessage[]
}

interface ChatMessageEvent {
  id: string
  type: 'message'
  message: ChatMessage
}

type ChatEvent = ChatInitEvent | ChatMessageEvent

/**
 * Example component demonstrating real-time chat with tRPC SSE subscriptions
 * Requires authentication to send messages
 */
export function ChatExample() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [newMessage, setNewMessage] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Query current user (retry: false to avoid repeated 401 errors when not logged in)
  const { data: currentUser } = useQuery({
    ...trpc.auth.me.queryOptions(),
    retry: false,
  })

  // Query messages (initial fetch)
  const { data: messages = [], isLoading } = useQuery(trpc.chat.messages.queryOptions())

  // Send message mutation
  const sendMutation = useMutation(
    trpc.chat.sendMessage.mutationOptions({
      onSuccess: () => {
        setNewMessage('')
      },
    }),
  )

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger on message count change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // SSE subscription for real-time updates
  useEffect(() => {
    setConnectionStatus('connecting')

    const unsubscribe = trpcClient.chat.onMessage.subscribe(undefined, {
      onData: (data: ChatEvent) => {
        if (data.type === 'init') {
          queryClient.setQueryData(trpc.chat.messages.queryKey(), data.messages)
          setConnectionStatus('connected')
        } else if (data.type === 'message') {
          queryClient.setQueryData(trpc.chat.messages.queryKey(), (old: ChatMessage[] = []) => {
            // Avoid duplicate messages
            if (old.some((m) => m.id === data.message.id)) {
              return old
            }
            return [...old, data.message]
          })
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

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return

    sendMutation.mutate({ content: newMessage })
  }

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Chat Example</h1>
        <p className="text-muted-foreground">Real-time global chat using tRPC SSE subscriptions</p>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <Badge
          variant={
            connectionStatus === 'connected'
              ? 'default'
              : connectionStatus === 'connecting'
                ? 'secondary'
                : 'destructive'
          }
        >
          {connectionStatus === 'connected' && 'Connected'}
          {connectionStatus === 'connecting' && 'Connecting...'}
          {connectionStatus === 'disconnected' && 'Disconnected'}
        </Badge>
        {currentUser && <Badge variant="outline">Logged in as {currentUser.name}</Badge>}
      </div>

      {/* Chat Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            {isLoading
              ? 'Loading...'
              : `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto space-y-4 pr-2">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No messages yet. Be the first to say something!
              </p>
            ) : (
              messages.map((message: ChatMessage) => (
                <div
                  key={message.id}
                  className={`flex flex-col gap-1 ${
                    message.authorId === currentUser?.id ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.authorId === currentUser?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{message.authorName}</span>
                    <span>{formatTime(message.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Send Message Form */}
      {currentUser ? (
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sendMutation.isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={sendMutation.isPending || !newMessage.trim()}>
            {sendMutation.isPending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">You must be logged in to send messages.</p>
          </CardContent>
        </Card>
      )}

      {/* Implementation Info */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>SSE Subscriptions:</strong> Real-time message delivery via{' '}
            <code>httpSubscriptionLink</code> with event-driven updates.
          </p>
          <p>
            <strong>Authentication:</strong> Sending messages requires login using{' '}
            <code>protectedProcedure</code>.
          </p>
          <p className="text-muted-foreground">
            Try opening this page in multiple browser windows to see real-time updates!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
