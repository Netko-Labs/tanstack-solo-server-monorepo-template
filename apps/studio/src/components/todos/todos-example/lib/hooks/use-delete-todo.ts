import { useMutation, useMutationState } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc'
import { todoErrorMessage, todoIdOf } from '../utils'
import { useInvalidateTodos } from './use-invalidate-todos'

export function useDeleteTodo() {
  const trpc = useTRPC()
  const invalidateTodos = useInvalidateTodos()
  // Settled, not success: a not_found means the row is already gone, so refresh either way.
  const mutation = useMutation(trpc.todos.delete.mutationOptions({ onSettled: invalidateTodos }))
  const busyIds = useMutationState({
    filters: { mutationKey: trpc.todos.delete.mutationKey(), status: 'pending' },
    select: (entry) => todoIdOf(entry.state.variables),
  })

  return {
    remove: (todoId: string) => mutation.mutate({ todoId }),
    isDeleting: (todoId: string) => busyIds.includes(todoId),
    error: todoErrorMessage(mutation.error),
  }
}
