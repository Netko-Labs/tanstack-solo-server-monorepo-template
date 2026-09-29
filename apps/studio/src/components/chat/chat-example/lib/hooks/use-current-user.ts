import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc'

/** `auth.me` is public and returns null for anonymous visitors, so no error path here. */
export function useCurrentUser() {
  const trpc = useTRPC()
  return useQuery(trpc.auth.me.queryOptions())
}
