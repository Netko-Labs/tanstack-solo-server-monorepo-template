import { type Todo, type TodoPatchInput, todoTable } from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'
import { and, eq } from 'drizzle-orm'
import { TodoError } from './todo-error'

export const updateTodo = async (
  userId: string,
  { todoId, ...data }: TodoPatchInput,
): Promise<Todo> => {
  const [row] = await db
    .update(todoTable)
    .set(data)
    .where(and(eq(todoTable.userId, userId), eq(todoTable.id, todoId)))
    .returning()
  if (!row) throw new TodoError('not_found')
  return row
}
