import { z } from 'zod'
import { ChatMessageSchema } from '../entities/chat'

/** Bounded and predictable: room ids become Redis keys and pub/sub channels. */
export const RoomIdSchema = z.string().regex(/^[a-z0-9-]{1,64}$/)

export const MemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  status: z.enum(['active', 'idle']),
})
export type Member = z.infer<typeof MemberSchema>

export const RoomStreamInputSchema = z.object({ roomId: RoomIdSchema })
export type RoomStreamInput = z.infer<typeof RoomStreamInputSchema>

export const RoomStatusInputSchema = z.object({
  roomId: RoomIdSchema,
  connectionId: z.string().uuid(),
  status: MemberSchema.shape.status,
})
export type RoomStatusInput = z.infer<typeof RoomStatusInputSchema>

/** True when the connection belonged to the caller and its status was stored. */
export const RoomStatusResultSchema = z.boolean()

/** Events streamed from the room subscription (server → client) and across instances. */
export const RoomEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('sync'),
    /** This stream's presence record; the client echoes it on `room.setStatus`. */
    connectionId: z.string(),
    members: z.array(MemberSchema),
    messages: z.array(ChatMessageSchema),
  }),
  z.object({ type: z.literal('presence'), members: z.array(MemberSchema) }),
  z.object({ type: z.literal('join'), member: MemberSchema }),
  z.object({ type: z.literal('leave'), userId: z.string() }),
  z.object({ type: z.literal('chat'), message: ChatMessageSchema }),
])
export type RoomEvent = z.infer<typeof RoomEventSchema>
