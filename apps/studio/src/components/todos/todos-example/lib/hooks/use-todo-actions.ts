import { type QueryKey, useMutation, useMutationState, useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/trpc'
import type { TodoAction } from '../types'

const TODO_ACTION_KEY = ['todo-action']

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

/** One command mutation for the three sibling writes; pending is read across all in-flight calls. */
export function useTodoActions(listKey: QueryKey, onSettled: () => void) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationKey: TODO_ACTION_KEY,
    mutationFn: run,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey })
      onSettled()
    },
  })
  const inFlight = useMutationState({
    filters: { mutationKey: TODO_ACTION_KEY, status: 'pending' },
    select: (entry) => (entry.state.variables as TodoAction | undefined)?.type,
  })
  const isPending = (type: TodoAction['type']) => inFlight.includes(type)

  return { dispatch: mutation.mutate, isPending }
}
