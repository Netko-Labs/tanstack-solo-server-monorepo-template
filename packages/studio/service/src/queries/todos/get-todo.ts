import { type Todo, todoTable } from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'
import { and, eq } from 'drizzle-orm'

export const getTodo = async (userId: string, todoId: string): Promise<Todo | undefined> => {
  return await db
    .select()
    .from(todoTable)
    .where(and(eq(todoTable.userId, userId), eq(todoTable.id, todoId)))
    .then(([r]) => r)
}
