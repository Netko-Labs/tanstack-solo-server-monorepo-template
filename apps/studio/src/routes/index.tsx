import { createFileRoute } from '@tanstack/react-router'
import { ComponentExample } from '@/components/home/component-example'
import { getSession } from '@/integrations/auth'

export const Route = createFileRoute('/')({
  loader: async () => ({ user: await getSession() }),
  component: ComponentExample,
})
