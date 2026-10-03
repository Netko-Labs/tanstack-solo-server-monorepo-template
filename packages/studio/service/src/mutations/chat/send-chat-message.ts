import {
  type ChatMessage,
  type ChatMessageSendInput,
  displayName,
  type UserAuth,
} from '@temp-repo/studio-domain'
import { hub } from '../../room'
import { createChatMessage } from './create-message'

/** Persisted before it is broadcast: a lost publish loses a notification, never the message. */
export const sendChatMessage = async (
  author: UserAuth,
  { roomId, content }: ChatMessageSendInput,
): Promise<ChatMessage | null> => {
  const message = await createChatMessage({
    roomId,
    content,
    authorId: author.id,
    authorName: displayName(author),
  })
  if (message) await hub.chat(roomId, message)
  return message
}
