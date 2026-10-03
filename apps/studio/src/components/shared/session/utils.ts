import type { SessionUser } from '@temp-repo/studio-domain'

/** The better-auth user narrowed to what route data carries, so both sources render alike. */
export function pickSessionUser(user: SessionUser | null | undefined): SessionUser | null {
  if (!user) return null
  return { id: user.id, name: user.name, email: user.email, image: user.image }
}
