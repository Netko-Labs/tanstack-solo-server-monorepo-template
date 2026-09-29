import { z } from 'zod'
import { ChatMessageSchema } from '../entities/chat'

export const MemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  status: z.enum(['active', 'idle']),
})
export type Member = z.infer<typeof MemberSchema>

/** Events streamed from the room subscription (server → client) and across instances. */
export const RoomEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('sync'),
    members: z.array(MemberSchema),
    messages: z.array(ChatMessageSchema),
  }),
  z.object({ type: z.literal('presence'), members: z.array(MemberSchema) }),
  z.object({ type: z.literal('join'), member: MemberSchema }),
  z.object({ type: z.literal('leave'), userId: z.string() }),
  z.object({ type: z.literal('chat'), message: ChatMessageSchema }),
])
export type RoomEvent = z.infer<typeof RoomEventSchema>
