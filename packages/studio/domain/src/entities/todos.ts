import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { todoTable } from '../db'
import { TODO_DESCRIPTION_MAX, TODO_TITLE_MAX } from '../values'

export const TodoInsertSchema = createInsertSchema(todoTable, {
  title: (schema) => schema.min(1).max(TODO_TITLE_MAX),
  description: (schema) => schema.max(TODO_DESCRIPTION_MAX),
})
export type TodoInsert = z.infer<typeof TodoInsertSchema>

export const TodoSchema = createSelectSchema(todoTable)
export type Todo = z.infer<typeof TodoSchema>
