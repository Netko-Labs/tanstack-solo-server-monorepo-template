import { describe, expect, test } from 'bun:test'
import { appRouter } from './index'

/** Every procedure is protected unless listed here on purpose. */
const PUBLIC = new Set(['auth.me'])

const anonymous = appRouter.createCaller({ user: null, session: null })

describe('procedure auth', () => {
  test('anonymous callers are refused everywhere except the explicit public list', async () => {
    const paths = Object.keys(appRouter._def.procedures)
    expect(paths.length).toBeGreaterThan(3)
    for (const path of paths) {
      if (PUBLIC.has(path)) continue
      const call = path
        .split('.')
        .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], anonymous)
      await expect(
        (call as (input?: unknown) => Promise<unknown>)(undefined),
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    }
  })

  test('an expired session is refused', async () => {
    const expired = appRouter.createCaller({
      user: { id: 'u', name: 'u', email: 'u@example.com' } as never,
      session: { id: 's', userId: 'u', expiresAt: new Date(Date.now() - 1000) } as never,
    })
    await expect(expired.todos.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})
