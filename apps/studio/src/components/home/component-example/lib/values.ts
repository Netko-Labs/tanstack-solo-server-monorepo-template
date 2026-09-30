import type { FeatureCardProps } from './types'

export const PAGE_TITLE = 'Studio Demo'
export const PAGE_DESCRIPTION =
  'A modern full-stack monorepo template with TanStack Start, tRPC, Better Auth, and real-time WebSocket subscriptions.'

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
      'CRUD operations over tRPC HTTP batching. Create, update, and delete todos with TanStack Query.',
    href: '/todos',
    badge: 'HTTP',
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
    body: 'Type-safe queries, mutations, and WebSocket subscriptions with automatic inference.',
  },
  {
    title: 'Better Auth',
    description: 'Modern authentication',
    body: 'Magic-link sign-in out of the box; OAuth providers switch on with env vars.',
  },
]

export const CODE_EXAMPLE_TRPC = `
// packages/studio/trpc/src/routers/room/index.ts
export const roomRouter = router({
  send: protectedProcedure
    .input(z.object({ roomId: RoomIdSchema, content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const message = await createChatMessage({
        roomId: input.roomId,
        content: input.content,
        authorId: ctx.user.id,
        authorName: displayName(ctx.user),
      })
      if (message) await hub.chat(input.roomId, message)
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
// WebSocket subscription (wsLink → /trpc-ws) for presence + live chat
import { trpcClient } from '@/integrations/trpc'

useEffect(() => {
  const unsubscribe = trpcClient.room.stream.subscribe(
    { roomId: 'lobby' },
    {
      onData: (event) => {
        if (event.type === 'sync') setMessages(event.messages)
        else if (event.type === 'chat') setMessages((prev) => [...prev, event.message])
      },
      onError: (err) => console.error('ws error:', err),
    },
  )

  return () => unsubscribe.unsubscribe()
}, [])
`
