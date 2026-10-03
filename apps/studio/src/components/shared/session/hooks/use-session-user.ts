import { useHydrated } from '@tanstack/react-router'
import type { SessionUser } from '@temp-repo/studio-domain'
import { useSession } from '@/integrations/auth'
import { pickSessionUser } from '../utils'

/**
 * SSR and the hydration pass render the loader's user; the live session takes over once it
 * settles, so sign-in and sign-out update without a reload and nothing flashes in between.
 */
export function useSessionUser(initialUser: SessionUser | null | undefined) {
  const live = useSession()
  const isHydrated = useHydrated()
  const isSettled = isHydrated && !live.isPending
  return {
    user: isSettled ? pickSessionUser(live.data?.user) : (initialUser ?? null),
    isPending: !isSettled && initialUser === undefined,
  }
}
