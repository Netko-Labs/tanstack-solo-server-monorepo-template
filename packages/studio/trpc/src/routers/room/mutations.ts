import {
  ChatMessageSchema,
  ChatMessageSendInputSchema,
  RoomStatusInputSchema,
  RoomStatusResultSchema,
} from '@temp-repo/studio-domain'
import { hub, sendChatMessage } from '@temp-repo/studio-service'
import { protectedProcedure, router } from '../../init'

export const roomMutations = router({
  send: protectedProcedure
    .input(ChatMessageSendInputSchema)
    .output(ChatMessageSchema.nullable())
    .mutation(({ ctx, input }) => sendChatMessage(ctx.user, input)),

  setStatus: protectedProcedure
    .input(RoomStatusInputSchema)
    .output(RoomStatusResultSchema)
    .mutation(({ ctx, input }) =>
      hub.setStatus(input.roomId, input.connectionId, ctx.user.id, input.status),
    ),
})
