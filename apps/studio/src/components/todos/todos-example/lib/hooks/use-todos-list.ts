import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc'

export function useTodosList() {
  const trpc = useTRPC()
  return useQuery({ ...trpc.todos.list.queryOptions(), retry: false })
}
