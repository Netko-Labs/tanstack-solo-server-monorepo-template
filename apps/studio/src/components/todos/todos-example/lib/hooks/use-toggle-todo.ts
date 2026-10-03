import { useMutation, useMutationState } from '@tanstack/react-query'
import type { Todo } from '@temp-repo/studio-domain'
import { useTRPC } from '@/integrations/trpc'
import { todoErrorMessage, todoIdOf } from '../utils'
import { useInvalidateTodos } from './use-invalidate-todos'

export function useToggleTodo() {
  const trpc = useTRPC()
  const invalidateTodos = useInvalidateTodos()
  // Settled, not success: a not_found means the row is already gone, so refresh either way.
  const mutation = useMutation(trpc.todos.update.mutationOptions({ onSettled: invalidateTodos }))
  // Read from the cache, not mutation.variables: two rows toggled at once both stay busy.
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
