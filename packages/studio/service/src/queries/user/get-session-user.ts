import type { SessionUser } from '@temp-repo/studio-domain'
import { auth } from '../../auth'

/** Whoever holds a live session on this request; null when signed out or expired. */
export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
  const result = await auth.api.getSession({ headers })
  if (!result?.user) return null
  const { id, name, email, image } = result.user
  return { id, name, email, image }
}
