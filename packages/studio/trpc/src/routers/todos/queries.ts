import { TodoIdInputSchema, TodoListSchema, TodoSchema } from '@temp-repo/studio-domain'
import { getTodo, getTodos } from '@temp-repo/studio-service'
import { protectedProcedure, router } from '../../init'

export const todosQueries = router({
  list: protectedProcedure.output(TodoListSchema).query(({ ctx }) => getTodos(ctx.user.id)),
  getById: protectedProcedure
    .input(TodoIdInputSchema)
    .output(TodoSchema.nullable())
    .query(({ ctx, input }) => getTodo(ctx.user.id, input.todoId)),
})
