import { type QueryKey, useMutation, useMutationState, useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/trpc'
import { TODO_ACTION_KEY } from '../constants'
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

/** One command mutation for the three sibling writes; pending is read per action and per todo. */
export function useTodoActions(listKey: QueryKey, onSuccess: (action: TodoAction) => void) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationKey: TODO_ACTION_KEY,
    mutationFn: run,
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: listKey })
      onSuccess(action)
    },
  })
  const inFlight = useMutationState({
    filters: { mutationKey: TODO_ACTION_KEY, status: 'pending' },
    select: (entry) => entry.state.variables as TodoAction | undefined,
  })
  const isPending = (type: TodoAction['type'], todoId?: string) =>
    inFlight.some(
      (action) =>
        action?.type === type &&
        (todoId === undefined || ('todoId' in action && action.todoId === todoId)),
    )

  return { dispatch: mutation.mutate, isPending, error: mutation.error?.message }
}
