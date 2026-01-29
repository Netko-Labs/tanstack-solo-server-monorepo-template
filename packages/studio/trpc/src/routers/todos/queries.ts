import { getTodo, getTodos } from '@temp-repo/studio-service'
import { z } from 'zod'
import { publicProcedure, router } from '../../init'

export const todosQueries = router({
  list: publicProcedure.query(async () => {
    return getTodos()
  }),

  getById: publicProcedure.input(z.object({ todoId: z.string() })).query(async ({ input }) => {
    return getTodo(input.todoId)
  }),
})
