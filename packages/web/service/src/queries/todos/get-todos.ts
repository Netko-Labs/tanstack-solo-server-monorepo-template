import { type Todo, todoTable } from '@temp-repo/web-domain'
import { db } from '@temp-repo/web-repository'

export const getTodos = async (): Promise<Todo[]> => {
  return await db.select().from(todoTable)
}
