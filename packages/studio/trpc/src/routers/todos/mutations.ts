import { TodoInsertSchema } from '@temp-repo/studio-domain'
import { createTodo, deleteTodo, updateTodo } from '@temp-repo/studio-service'
import { z } from 'zod'
import { publicProcedure, router } from '../../init'

export const todosMutations = router({
  create: publicProcedure.input(TodoInsertSchema).mutation(async ({ input }) => {
    return createTodo(input)
  }),

  update: publicProcedure
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

  delete: publicProcedure.input(z.object({ todoId: z.string() })).mutation(async ({ input }) => {
    return deleteTodo(input.todoId)
  }),

  toggleComplete: publicProcedure
    .input(z.object({ todoId: z.string(), completed: z.boolean() }))
    .mutation(async ({ input }) => {
      return updateTodo(input.todoId, { completed: input.completed })
    }),
})
