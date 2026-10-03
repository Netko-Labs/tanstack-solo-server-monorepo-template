import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc'
import { toUserMessage } from '@/shared/trpc-error'

export function useTodosList() {
  const trpc = useTRPC()
  const query = useQuery(trpc.todos.list.queryOptions())
  return {
    todos: query.data,
    isError: query.isError && !query.data,
    error: toUserMessage(query.error),
    retry: () => void query.refetch(),
  }
}
