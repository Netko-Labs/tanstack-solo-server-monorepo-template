import type { Member } from '@temp-repo/studio-domain'

export const member = (userId: string, status: Member['status'] = 'active'): Member => ({
  userId,
  name: userId,
  status,
})
