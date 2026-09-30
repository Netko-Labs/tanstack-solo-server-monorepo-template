import { getTodo, getTodos } from '@temp-repo/studio-service'
import { z } from 'zod'
import { protectedProcedure, router } from '../../init'

export const todosQueries = router({
  list: protectedProcedure.query(async ({ ctx }) => getTodos(ctx.user.id)),
  getById: protectedProcedure
    .input(z.object({ todoId: z.string().uuid() }))
    .query(async ({ ctx, input }) => getTodo(ctx.user.id, input.todoId)),
})
