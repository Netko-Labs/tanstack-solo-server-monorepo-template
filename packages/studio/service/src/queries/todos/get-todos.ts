import { type Todo, todoTable } from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'
import { desc, eq } from 'drizzle-orm'

export const getTodos = async (userId: string): Promise<Todo[]> => {
  return await db
    .select()
    .from(todoTable)
    .where(eq(todoTable.userId, userId))
    .orderBy(desc(todoTable.createdAt))
}
