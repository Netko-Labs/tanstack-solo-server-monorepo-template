import { TodoCreateInputSchema, TodoPatchInputSchema } from '@temp-repo/studio-domain'
import { createTodo, deleteTodo, updateTodo } from '@temp-repo/studio-service'
import { z } from 'zod'
import { protectedProcedure, router } from '../../init'

export const todosMutations = router({
  create: protectedProcedure
    .input(TodoCreateInputSchema)
    .mutation(async ({ ctx, input }) => createTodo(ctx.user.id, input)),
  update: protectedProcedure
    .input(TodoPatchInputSchema)
    .mutation(async ({ ctx, input }) => updateTodo(ctx.user.id, input)),
  delete: protectedProcedure
    .input(z.object({ todoId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => deleteTodo(ctx.user.id, input.todoId)),
})
