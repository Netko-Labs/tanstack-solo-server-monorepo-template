import { createFileRoute } from '@tanstack/react-router'
import { ChatExample } from '@/components/chat/chat-example'
import { getSession } from '@/integrations/auth'

export const Route = createFileRoute('/chat')({
  loader: async () => ({ user: await getSession() }),
  component: ChatExample,
})
