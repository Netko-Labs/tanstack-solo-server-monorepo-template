import {
  type ChatMessage,
  type ChatMessageInsert,
  chatMessageTable,
} from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'

export const createChatMessage = async (data: ChatMessageInsert): Promise<ChatMessage | null> => {
  const [row] = await db.insert(chatMessageTable).values(data).returning()
  return row ?? null
}
