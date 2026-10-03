import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { chatMessageTable } from '../db'
import { CHAT_CONTENT_MAX } from '../values'

export const ChatMessageInsertSchema = createInsertSchema(chatMessageTable, {
  content: (schema) => schema.min(1).max(CHAT_CONTENT_MAX),
})
export type ChatMessageInsert = z.infer<typeof ChatMessageInsertSchema>

export const ChatMessageSchema = createSelectSchema(chatMessageTable)
export type ChatMessage = z.infer<typeof ChatMessageSchema>
