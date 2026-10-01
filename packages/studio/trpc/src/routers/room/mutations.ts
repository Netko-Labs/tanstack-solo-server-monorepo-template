import {
  ChatMessageSchema,
  ChatMessageSendInputSchema,
  displayName,
  RoomStatusInputSchema,
  RoomStatusResultSchema,
} from '@temp-repo/studio-domain'
import { createChatMessage, hub } from '@temp-repo/studio-service'
import { protectedProcedure, router } from '../../init'

export const roomMutations = router({
  send: protectedProcedure
    .input(ChatMessageSendInputSchema)
    .output(ChatMessageSchema.nullable())
    .mutation(async ({ ctx, input }) => {
      const message = await createChatMessage({
        roomId: input.roomId,
        content: input.content,
        authorId: ctx.user.id,
        authorName: displayName(ctx.user),
      })
      if (message) await hub.chat(input.roomId, message)
      return message
    }),

  setStatus: protectedProcedure
    .input(RoomStatusInputSchema)
    .output(RoomStatusResultSchema)
    .mutation(({ ctx, input }) =>
      hub.setStatus(input.roomId, input.connectionId, ctx.user.id, input.status),
    ),
})
