import type { Member } from '@temp-repo/studio-domain'

export const member = (userId: string): Member => ({ userId, name: userId, status: 'active' })
