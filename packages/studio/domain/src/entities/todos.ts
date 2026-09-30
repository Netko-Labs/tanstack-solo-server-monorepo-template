import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'
import { todoTable } from '../db'

export const TodoInsertSchema = createInsertSchema(todoTable)
export type TodoInsert = z.infer<typeof TodoInsertSchema>

export const TodoUpdateSchema = createUpdateSchema(todoTable).required({ id: true })
export type TodoUpdate = z.infer<typeof TodoUpdateSchema>

export const TodoSchema = createSelectSchema(todoTable)
export type Todo = z.infer<typeof TodoSchema>

/** What a client may send; ownership and ids come from the session and the database. */
export const TodoCreateInputSchema = TodoInsertSchema.pick({ title: true, description: true })
export type TodoCreateInput = z.infer<typeof TodoCreateInputSchema>

export const TodoPatchInputSchema = z.object({
  todoId: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().nullish(),
  completed: z.boolean().optional(),
})
export type TodoPatchInput = z.infer<typeof TodoPatchInputSchema>
