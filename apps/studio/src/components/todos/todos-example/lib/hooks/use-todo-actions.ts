import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trpcClient, useTRPC } from '@/integrations/trpc'
import type { TodoAction } from '../types'

const run = (action: TodoAction) => {
  switch (action.type) {
    case 'create':
      return trpcClient.todos.create.mutate(action.input)
    case 'toggle':
      return trpcClient.todos.update.mutate({ todoId: action.todoId, completed: action.completed })
    case 'delete':
      return trpcClient.todos.delete.mutate({ todoId: action.todoId })
  }
}

/** One command mutation for the three sibling writes; pending state is per action type. */
export function useTodoActions(onSettled: () => void) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: run,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      onSettled()
    },
  })
  const isPending = (type: TodoAction['type']) =>
    mutation.isPending && mutation.variables?.type === type

  return { dispatch: mutation.mutate, isPending }
}
