import type { RoomEvent } from '@temp-repo/studio-domain'
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
      if (message) hub.chat(input.roomId, message)
      return message
    }),

  stream: protectedProcedure
    .input(z.object({ roomId: z.string().min(1) }))
    .subscription(async function* ({ ctx, input, signal }) {
      const member = {
        userId: ctx.user.id,
        name: ctx.user.name || ctx.user.email,
        status: 'active' as const,
      }
      const queue: RoomEvent[] = []
      const off = hub.on(input.roomId, (event) => queue.push(event))
      hub.join(input.roomId, member)
      try {
        yield {
          type: 'sync' as const,
          members: hub.members(input.roomId),
          messages: await getChatMessages(),
        }
        while (!signal?.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          while (queue.length > 0) {
            const event = queue.shift()
            if (event) yield event
          }
        }
      } finally {
        off()
        hub.leave(input.roomId, member.userId)
      }
    }),
})
