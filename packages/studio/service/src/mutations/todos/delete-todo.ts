import { type Todo, todoTable } from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'
import { and, eq } from 'drizzle-orm'
import { TodoError } from './todo-error'

export const deleteTodo = async (userId: string, todoId: string): Promise<Todo> => {
  const [row] = await db
    .delete(todoTable)
    .where(and(eq(todoTable.userId, userId), eq(todoTable.id, todoId)))
    .returning()
  if (!row) throw new TodoError('not_found')
  return row
}
