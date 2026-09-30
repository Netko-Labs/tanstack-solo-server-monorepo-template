import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { user } from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'
import { inArray } from 'drizzle-orm'
import { getTodo, getTodos } from '../../queries/todos'
import { createTodo } from './create-todo'
import { deleteTodo } from './delete-todo'
import { updateTodo } from './update-todo'

const hasDb = Boolean(process.env.DATABASE_URL)
const ids = { a: `test-${crypto.randomUUID()}`, b: `test-${crypto.randomUUID()}` }

describe.skipIf(!hasDb)('todo ownership', () => {
  beforeAll(async () => {
    const now = new Date()
    await db.insert(user).values(
      Object.values(ids).map((id) => ({
        id,
        name: id,
        email: `${id}@example.com`,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      })),
    )
  })
  afterAll(async () => {
    // cascades the todos
    await db.delete(user).where(inArray(user.id, Object.values(ids)))
  })

  test('another user cannot read, change or delete a todo', async () => {
    const todo = await createTodo(ids.a, { title: 'mine', description: null })
    if (!todo) throw new Error('unreachable')
    expect(await getTodo(ids.b, todo.id)).toBeUndefined()
    expect(await updateTodo(ids.b, { todoId: todo.id, completed: true })).toBeUndefined()
    expect(await deleteTodo(ids.b, todo.id)).toBeUndefined()
    expect((await getTodos(ids.b)).map((t) => t.id)).not.toContain(todo.id)
    expect((await getTodo(ids.a, todo.id))?.completed).toBe(false)
    expect((await deleteTodo(ids.a, todo.id))?.id).toBe(todo.id)
  })
})
