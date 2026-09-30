import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { todoTable } from '../db'

const TITLE_MAX = 200
const DESCRIPTION_MAX = 2000

export const TodoInsertSchema = createInsertSchema(todoTable, {
  title: (schema) => schema.min(1).max(TITLE_MAX),
  description: (schema) => schema.max(DESCRIPTION_MAX),
})
export type TodoInsert = z.infer<typeof TodoInsertSchema>

export const TodoSchema = createSelectSchema(todoTable)
export type Todo = z.infer<typeof TodoSchema>

/** What a client may send; ownership and ids come from the session and the database. */
export const TodoCreateInputSchema = TodoInsertSchema.pick({ title: true, description: true })
export type TodoCreateInput = z.infer<typeof TodoCreateInputSchema>

export const TodoPatchInputSchema = z
  .object({
    todoId: z.string().uuid(),
    title: z.string().min(1).max(TITLE_MAX).optional(),
    description: z.string().max(DESCRIPTION_MAX).nullish(),
    completed: z.boolean().optional(),
  })
  .refine(
    (patch) =>
      patch.title !== undefined || patch.description !== undefined || patch.completed !== undefined,
    { message: 'nothing to update' },
  )
export type TodoPatchInput = z.infer<typeof TodoPatchInputSchema>
