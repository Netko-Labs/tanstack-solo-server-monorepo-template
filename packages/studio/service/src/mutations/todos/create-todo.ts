import { type Todo, type TodoCreateInput, todoTable } from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'

export const createTodo = async (
  userId: string,
  data: TodoCreateInput,
): Promise<Todo | undefined> => {
  return await db
    .insert(todoTable)
    .values({ ...data, userId })
    .returning()
    .then(([r]) => r)
}
