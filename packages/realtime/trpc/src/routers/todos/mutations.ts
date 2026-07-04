import { TodoInsertSchema } from '@temp-repo/realtime-domain'
import { createTodo, deleteTodo, updateTodo } from '@temp-repo/realtime-service'
import { z } from 'zod'
import { protectedProcedure, router } from '../../init'

export const todosMutations = router({
  create: protectedProcedure
    .input(TodoInsertSchema)
    .mutation(async ({ input }) => createTodo(input)),
  update: protectedProcedure
    .input(
      z.object({
        todoId: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().nullish(),
        completed: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { todoId, ...data } = input
      return updateTodo(todoId, data)
    }),
  delete: protectedProcedure
    .input(z.object({ todoId: z.string() }))
    .mutation(async ({ input }) => deleteTodo(input.todoId)),
})
