import { z } from 'zod'
import { TodoInsertSchema, TodoSchema } from '../entities/todos'
import { TODO_ERROR_CODES } from '../values'

export const TodoIdInputSchema = z.object({ todoId: z.string().uuid() })
export type TodoIdInput = z.infer<typeof TodoIdInputSchema>

/** What a client may send; ownership and ids come from the session and the database. */
export const TodoCreateInputSchema = TodoInsertSchema.pick({ title: true, description: true })
export type TodoCreateInput = z.infer<typeof TodoCreateInputSchema>

export const TodoPatchInputSchema = TodoIdInputSchema.extend(
  TodoInsertSchema.pick({ title: true, description: true, completed: true }).partial().shape,
).refine(
  (patch) =>
    patch.title !== undefined || patch.description !== undefined || patch.completed !== undefined,
  { message: 'nothing to update' },
)
export type TodoPatchInput = z.infer<typeof TodoPatchInputSchema>

export const TodoListSchema = z.array(TodoSchema)

export const TodoErrorCodeSchema = z.enum(TODO_ERROR_CODES)
export type TodoErrorCode = z.infer<typeof TodoErrorCodeSchema>
