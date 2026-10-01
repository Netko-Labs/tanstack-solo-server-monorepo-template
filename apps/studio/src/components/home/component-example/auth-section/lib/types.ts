import type { SessionUser } from '@temp-repo/studio-domain'

export interface AuthLoggedInProps {
  user: SessionUser
  isSigningOut: boolean
  onSignOut: () => void
}
