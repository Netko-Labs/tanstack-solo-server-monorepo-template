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
      'CRUD over tRPC HTTP batching, behind an _authed layout route that redirects to sign-in.',
    href: '/todos',
    badge: 'Signed in',
  },
  {
    title: 'Chat Example',
    description:
      'Real-time global chat using tRPC subscriptions. Requires authentication to send messages.',
    href: '/chat',
    badge: 'WebSocket',
  },
]

export const TECH_STACK_ITEMS = [
  {
    title: 'TanStack Start',
    description: 'Full-stack React framework',
    body: 'File-based routing, SSR, server functions and API routes on Nitro under Bun.',
  },
  {
    title: 'tRPC',
    description: 'End-to-end typesafe APIs',
    body: 'Queries and mutations over HTTP batching; subscriptions over one WebSocket.',
  },
  {
    title: 'Better Auth',
    description: 'Modern authentication',
    body: 'Magic-link sign-in out of the box; OAuth providers switch on with env vars.',
  },
  {
    title: 'Drizzle + PostgreSQL',
    description: 'Typed schema and queries',
    body: 'Tables, drizzle-zod schemas and migrations live in the domain and repository packages.',
  },
  {
    title: 'Room bus',
    description: 'Presence and live chat',
    body: 'In-process by default; Redis pub/sub when CACHE_URL is set, for more than one instance.',
  },
  {
    title: 'Base UI + Tailwind v4',
    description: 'Shared UI package',
    body: 'shadcn-style primitives on Base UI with Tabler icons, shared by every app.',
  },
]

export const CODE_EXAMPLE_TRPC = `
// packages/studio/trpc/src/routers/room/mutations.ts
import { ChatMessageSchema, ChatMessageSendInputSchema } from '@temp-repo/studio-domain'
import { sendChatMessage } from '@temp-repo/studio-service'
import { protectedProcedure, router } from '../../init'

export const roomMutations = router({
  send: protectedProcedure
    .input(ChatMessageSendInputSchema)
    .output(ChatMessageSchema.nullable())
    .mutation(({ ctx, input }) => sendChatMessage(ctx.user, input)),
})
`

export const CODE_EXAMPLE_QUERY = `
// apps/studio/src/components/todos/todos-example/lib/hooks/use-toggle-todo.ts
import type { Todo } from '@temp-repo/studio-domain'
import { useMutation, useMutationState } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc'
import { todoErrorMessage, todoIdOf } from '../utils'
import { useInvalidateTodos } from './use-invalidate-todos'

export function useToggleTodo() {
  const trpc = useTRPC()
  const invalidateTodos = useInvalidateTodos()
  const mutation = useMutation(trpc.todos.update.mutationOptions({ onSettled: invalidateTodos }))
  const busyIds = useMutationState({
    filters: { mutationKey: trpc.todos.update.mutationKey(), status: 'pending' },
    select: (entry) => todoIdOf(entry.state.variables),
  })

  return {
    toggle: (todo: Todo) => mutation.mutate({ todoId: todo.id, completed: !todo.completed }),
    isToggling: (todoId: string) => busyIds.includes(todoId),
    error: todoErrorMessage(mutation.error),
  }
}
`

export const CODE_EXAMPLE_SUBSCRIPTION = `
// apps/studio/src/components/chat/chat-example/lib/hooks/use-room-stream.ts (trimmed)
import { useEffect, useReducer } from 'react'
import { bindRealtimeSocket, trpcClient } from '@/integrations/trpc'
import { INITIAL_ROOM_STATE, roomReducer } from '../utils'

export function useRoomStream(roomId: string, userId: string | undefined) {
  const [state, dispatch] = useReducer(roomReducer, INITIAL_ROOM_STATE)

  useEffect(() => {
    bindRealtimeSocket(userId)
    if (!userId) return
    const sub = trpcClient.room.stream.subscribe(
      { roomId },
      {
        onData: (event) => dispatch({ type: 'event', event }),
        onError: () => dispatch({ type: 'status', connectionStatus: 'disconnected' }),
      },
    )
    return () => sub.unsubscribe()
  }, [roomId, userId])

  return state
}
`
