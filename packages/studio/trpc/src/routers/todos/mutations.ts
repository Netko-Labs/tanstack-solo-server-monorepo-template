import {
  TodoCreateInputSchema,
  TodoIdInputSchema,
  TodoPatchInputSchema,
  TodoSchema,
} from '@temp-repo/studio-domain'
import { createTodo, deleteTodo, updateTodo } from '@temp-repo/studio-service'
import { protectedProcedure, router } from '../../init'

export const todosMutations = router({
  create: protectedProcedure
    .input(TodoCreateInputSchema)
    .output(TodoSchema.nullable())
    .mutation(({ ctx, input }) => createTodo(ctx.user.id, input)),
  update: protectedProcedure
    .input(TodoPatchInputSchema)
    .output(TodoSchema)
    .mutation(({ ctx, input }) => updateTodo(ctx.user.id, input)),
  delete: protectedProcedure
    .input(TodoIdInputSchema)
    .output(TodoSchema)
    .mutation(({ ctx, input }) => deleteTodo(ctx.user.id, input.todoId)),
})
