import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import type { SessionUser } from '@temp-repo/studio-domain'
import { getSessionUser } from '@temp-repo/studio-service'

export const getSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => getSessionUser(getRequest().headers),
)
