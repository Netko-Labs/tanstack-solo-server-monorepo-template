import { getTodo, getTodos } from '@temp-repo/realtime-service'
import { z } from 'zod'
import { publicProcedure, router } from '../../init'

export const todosQueries = router({
  list: publicProcedure.query(async () => getTodos()),
  getById: publicProcedure
    .input(z.object({ todoId: z.string() }))
    .query(async ({ input }) => getTodo(input.todoId)),
})
