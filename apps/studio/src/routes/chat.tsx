import { createFileRoute } from '@tanstack/react-router'
import { ChatExample } from '@/components/chat/chat-example/chat-example'

export const Route = createFileRoute('/chat')({ component: ChatExample })
