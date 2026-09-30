import { MemberSchema } from '@temp-repo/studio-domain'
import { createChatMessage, getChatMessages, hub } from '@temp-repo/studio-service'
import { z } from 'zod'
import { protectedProcedure, publicProcedure, router } from '../../init'

/**
 * Chat history (query), send (mutation), and a presence + live-chat stream
 * (subscription over the WebSocket link). Presence is the subscription
 * lifecycle: subscribe = join, unsubscribe/disconnect = leave.
 */
export const roomRouter = router({
  messages: publicProcedure.query(async () => getChatMessages()),

  send: protectedProcedure
    .input(z.object({ roomId: z.string().min(1), content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const message = await createChatMessage({
        content: input.content,
        authorId: ctx.user.id,
        authorName: ctx.user.name || ctx.user.email,
      })
      if (message) await hub.chat(input.roomId, message)
      return message
    }),

  setStatus: protectedProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        connectionId: z.string().uuid(),
        status: MemberSchema.shape.status,
      }),
    )
    .mutation(async ({ ctx, input }) =>
      hub.setStatus(input.roomId, input.connectionId, ctx.user.id, input.status),
    ),

  stream: protectedProcedure
    .input(z.object({ roomId: z.string().min(1) }))
    .subscription(({ ctx, input, signal }) =>
      hub.stream(
        input.roomId,
        { userId: ctx.user.id, name: ctx.user.name || ctx.user.email, status: 'active' },
        signal,
      ),
    ),
})
