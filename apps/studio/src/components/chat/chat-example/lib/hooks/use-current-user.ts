import { useSession } from '@/integrations/auth'

/** The reactive better-auth session: sign-in/out updates it, so no stale cached user. */
export function useCurrentUser() {
  const { data: session, isPending } = useSession()
  return { data: session?.user ?? null, isPending }
}
