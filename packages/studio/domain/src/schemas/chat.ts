import type { z } from 'zod'
import { ChatMessageInsertSchema } from '../entities/chat'
import { RoomIdSchema } from './room'

export const ChatMessageSendInputSchema = ChatMessageInsertSchema.pick({ content: true }).extend({
  roomId: RoomIdSchema,
})
export type ChatMessageSendInput = z.infer<typeof ChatMessageSendInputSchema>
