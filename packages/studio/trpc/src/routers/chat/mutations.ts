import { chatEvents, createChatMessage } from '@temp-repo/studio-service'
import { z } from 'zod'
import { protectedProcedure, router } from '../../init'

export const chatMutations = router({
  sendMessage: protectedProcedure
    .input(z.object({ content: z.string().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      const message = await createChatMessage({
        content: input.content,
        authorId: ctx.user.id,
        authorName: ctx.user.name,
      })
      if (message) {
        chatEvents.emitMessage(message)
      }
      return message
    }),
})
