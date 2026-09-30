import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc'

export function useTodosList(enabled: boolean) {
  const trpc = useTRPC()
  const query = useQuery({ ...trpc.todos.list.queryOptions(), retry: false, enabled })
  return { query, queryKey: trpc.todos.list.queryKey() }
}
