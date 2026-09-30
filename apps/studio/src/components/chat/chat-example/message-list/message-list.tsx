import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@temp-repo/ui/components/card'
import type { MessageListProps } from '../lib'
import { MESSAGES_EMPTY, MESSAGES_LOADING, MESSAGES_TITLE } from '../lib'
import { ChatMessageItem } from './chat-message-item'
import { useAutoScroll } from './lib'

export function MessageList({ messages, isLoading, currentUserId }: MessageListProps) {
  const containerRef = useAutoScroll(messages.length)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{MESSAGES_TITLE}</CardTitle>
        <CardDescription>
          {isLoading
            ? 'Loading...'
            : `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-96 overflow-y-auto space-y-4 pr-2" aria-live="polite">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">{MESSAGES_LOADING}</p>
          ) : messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{MESSAGES_EMPTY}</p>
          ) : (
            messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.authorId === currentUserId}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
