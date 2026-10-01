import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc'

export function useTodosList() {
  const trpc = useTRPC()
  const query = useQuery({ ...trpc.todos.list.queryOptions(), retry: false })
  return { query, queryKey: trpc.todos.list.queryKey() }
}
