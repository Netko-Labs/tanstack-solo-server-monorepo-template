import type { FeatureCardProps } from './types'

export const PAGE_TITLE = 'Studio Demo'
export const PAGE_DESCRIPTION =
  'A modern full-stack monorepo template with TanStack Start, tRPC, Better Auth, and real-time SSE subscriptions.'

export const AUTH_SECTION_TITLE = 'Authentication'
export const INTERACTIVE_SECTION_TITLE = 'Interactive Examples'
export const TECH_STACK_SECTION_TITLE = 'Tech Stack'
export const CODE_EXAMPLES_SECTION_TITLE = 'Code Examples'
export const UI_SECTION_TITLE = 'UI Components'
export const FOOTER_TEXT =
  'Built with TanStack Start, tRPC, Better Auth, Drizzle ORM, and Tailwind CSS'

export const FEATURE_CARDS: FeatureCardProps[] = [
  {
    title: 'Todos Example',
    description:
      'CRUD operations with real-time SSE updates. Create, update, and delete todos with instant synchronization.',
    href: '/todos',
    badge: 'SSE',
  },
  {
    title: 'Chat Example',
    description:
      'Real-time global chat using tRPC subscriptions. Requires authentication to send messages.',
    href: '/chat',
    badge: 'Auth Required',
  },
]

export const TECH_STACK_ITEMS = [
  {
    title: 'TanStack Start',
    description: 'Full-stack React framework',
    body: 'File-based routing, SSR, API routes, and middleware out of the box.',
  },
  {
    title: 'tRPC',
    description: 'End-to-end typesafe APIs',
    body: 'Type-safe queries, mutations, and SSE subscriptions with automatic inference.',
  },
  {
    title: 'Better Auth',
    description: 'Modern authentication',
    body: 'Email/password, OAuth providers, passkeys, and magic links.',
  },
]

export const CODE_EXAMPLE_TRPC = `
// packages/studio/trpc/src/routers/chat/mutations.ts
import { protectedProcedure, router } from '../../init'
import { z } from 'zod'

export const chatMutations = router({
  sendMessage: protectedProcedure
    .input(z.object({ content: z.string().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      const message = await createChatMessage({
        content: input.content,
        authorId: ctx.user.id,
        authorName: ctx.user.name,
      })
      if (message) chatEvents.emitMessage(message)
      return message
    }),
})
`

export const CODE_EXAMPLE_QUERY = `
// Using tRPC with TanStack Query
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc'

function TodosComponent() {
  const trpc = useTRPC()

  const { data: todos } = useQuery(
    trpc.todos.list.queryOptions()
  )

  const createMutation = useMutation(
    trpc.todos.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.todos.list.queryKey()
        })
      },
    })
  )
}
`

export const CODE_EXAMPLE_SUBSCRIPTION = `
// SSE subscription for real-time updates
import { trpcClient } from '@/integrations/trpc'

useEffect(() => {
  const unsubscribe = trpcClient.chat.onMessage.subscribe(undefined, {
    onData: (data) => {
      if (data.type === 'init') {
        setMessages(data.messages)
      } else if (data.type === 'message') {
        setMessages((prev) => [...prev, data.message])
      }
    },
    onError: (err) => {
      console.error('SSE error:', err)
    },
  })

  return () => unsubscribe.unsubscribe()
}, [])
`
