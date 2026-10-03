import { type ChatMessage, chatMessageTable } from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'
import { desc, eq } from 'drizzle-orm'
import { CHAT_HISTORY_LIMIT } from '../../values/chat'

/** Newest `limit` messages of one room, oldest first; `id` breaks created_at ties. */
export const getChatMessages = async (
  roomId: string,
  limit = CHAT_HISTORY_LIMIT,
): Promise<ChatMessage[]> => {
  const messages = await db
    .select()
    .from(chatMessageTable)
    .where(eq(chatMessageTable.roomId, roomId))
    .orderBy(desc(chatMessageTable.createdAt), desc(chatMessageTable.id))
    .limit(limit)
  return messages.reverse()
}
