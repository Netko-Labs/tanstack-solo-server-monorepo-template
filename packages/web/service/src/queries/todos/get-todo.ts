import { type Todo, todoTable } from '@temp-repo/web-domain'
import { db } from '@temp-repo/web-repository'
import { eq } from 'drizzle-orm'

export const getTodo = async (todoId: string): Promise<Todo | undefined> => {
  return await db
    .select()
    .from(todoTable)
    .where(eq(todoTable.id, todoId))
    .then(([result]) => result)
}
