import { z } from 'zod'
import type { ChatMessage } from '../entities/chat'

export const MemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  status: z.enum(['active', 'idle']),
})
export type Member = z.infer<typeof MemberSchema>

/** Events streamed from the room subscription (server → client). */
export type RoomEvent =
  | { type: 'sync'; members: Member[]; messages: ChatMessage[] }
  | { type: 'presence'; members: Member[] }
  | { type: 'join'; member: Member }
  | { type: 'leave'; userId: string }
  | { type: 'chat'; message: ChatMessage }
