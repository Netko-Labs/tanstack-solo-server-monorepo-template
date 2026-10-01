import type { ChatMessage } from '@temp-repo/studio-domain'

export const msg = (id: string): ChatMessage => ({
  id,
  roomId: 'lobby',
  content: id,
  authorId: 'a',
  authorName: 'a',
  createdAt: new Date(0),
})
