import { createFileRoute } from '@tanstack/react-router'
import { ChatExample } from '@/components/chat-example'

export const Route = createFileRoute('/chat')({ component: ChatPage })

function ChatPage() {
  return <ChatExample />
}
