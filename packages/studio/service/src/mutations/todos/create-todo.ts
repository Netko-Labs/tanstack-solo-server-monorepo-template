import { type Todo, type TodoCreateInput, todoTable } from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'

export const createTodo = async (userId: string, data: TodoCreateInput): Promise<Todo | null> => {
  const [row] = await db
    .insert(todoTable)
    .values({ ...data, userId })
    .returning()
  return row ?? null
}
