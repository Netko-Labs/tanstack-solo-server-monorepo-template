import { useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc'

/** Every todo write returns a single row, so the list is refetched rather than patched. */
export function useInvalidateTodos() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
}
