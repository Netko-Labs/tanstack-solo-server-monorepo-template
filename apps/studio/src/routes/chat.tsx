import { createFileRoute } from '@tanstack/react-router'
import { ChatExample } from '@/components/chat/chat-example'
import { pageTitle } from '@/components/core/root'
import { getSession } from '@/integrations/auth'

export const Route = createFileRoute('/chat')({
  loader: async () => ({ user: await getSession() }),
  head: () => ({ meta: [{ title: pageTitle('Chat') }] }),
  component: ChatExample,
})
