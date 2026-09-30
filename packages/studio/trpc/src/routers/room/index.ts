import { displayName, MemberSchema, RoomIdSchema } from '@temp-repo/studio-domain'
import { createChatMessage, hub } from '@temp-repo/studio-service'
import { z } from 'zod'
import { protectedProcedure, router } from '../../init'

/**
 * Send (mutation), per-connection status (mutation), and a presence + live-chat stream
 * (subscription over the WebSocket link). History arrives with the stream's `sync`;
 * presence is the subscription lifecycle: subscribe = join, unsubscribe/disconnect = leave.
 */
export const roomRouter = router({
  send: protectedProcedure
    .input(z.object({ roomId: RoomIdSchema, content: z.string().min(1).max(2000) }))
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
    .input(
      z.object({
        roomId: RoomIdSchema,
        connectionId: z.string().uuid(),
        status: MemberSchema.shape.status,
      }),
    )
    .mutation(async ({ ctx, input }) =>
      hub.setStatus(input.roomId, input.connectionId, ctx.user.id, input.status),
    ),

  stream: protectedProcedure
    .input(z.object({ roomId: RoomIdSchema }))
    .subscription(({ ctx, input, signal }) =>
      hub.stream(
        input.roomId,
        { userId: ctx.user.id, name: displayName(ctx.user), status: 'active' },
        signal,
        ctx.session.expiresAt,
      ),
    ),
})
