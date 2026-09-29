import { type Todo, type TodoPatchInput, todoTable } from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'
import { and, eq } from 'drizzle-orm'

export const updateTodo = async (
  userId: string,
  { todoId, ...data }: TodoPatchInput,
): Promise<Todo | undefined> => {
  return await db
    .update(todoTable)
    .set(data)
    .where(and(eq(todoTable.userId, userId), eq(todoTable.id, todoId)))
    .returning()
    .then(([r]) => r)
}
