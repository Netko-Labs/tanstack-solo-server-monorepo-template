import { describe, expect, test } from 'bun:test'
import { TodoError } from '@temp-repo/studio-service'
import type { AnyProcedure } from '@trpc/server'
import { appRouter } from './index'
import { publicProcedure, router } from './init'

/** Every procedure is protected unless listed here on purpose. */
const PUBLIC = new Set(['auth.me'])

const procedures = Object.entries(
  appRouter._def.procedures as unknown as Record<string, AnyProcedure>,
)
const guarded = procedures.map(([path]) => path).filter((path) => !PUBLIC.has(path))

const callPath = (caller: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], caller) as (
    input?: unknown,
  ) => Promise<unknown>

describe('procedure auth', () => {
  test('anonymous callers are refused everywhere except the explicit public list', async () => {
    const anonymous = appRouter.createCaller({ user: null, session: null })
    for (const path of guarded) {
      await expect(callPath(anonymous, path)(undefined)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    }
  })

  test('an expired session is refused everywhere a session is required', async () => {
    const expired = appRouter.createCaller({
      user: { id: 'u', name: 'u', email: 'u@example.com' } as never,
      session: { id: 's', userId: 'u', expiresAt: new Date(Date.now() - 1000) } as never,
    })
    for (const path of guarded) {
      await expect(callPath(expired, path)(undefined)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    }
  })
})

describe('procedure contracts', () => {
  test('every query and mutation declares an output parser; subscriptions do not', () => {
    const misdeclared = procedures.filter(([, procedure]) => {
      const { _def: def } = procedure
      const hasOutput = 'output' in def && def.output !== undefined
      return def.type === 'subscription' ? hasOutput : !hasOutput
    })
    expect(misdeclared.map(([path]) => path)).toEqual([])
  })

  test('auth.me returns only the fields its output schema declares', async () => {
    const now = new Date()
    const declared = {
      id: 'u',
      name: 'u',
      email: 'u@example.com',
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    }
    const user = { ...declared, lastLoginMethod: 'magic-link' }
    const me = await appRouter.createCaller({ user, session: null } as never).auth.me()
    expect(me).toStrictEqual(declared)
  })

  test('a service error crosses the edge as its code and nothing else', async () => {
    const probe = router({
      missing: publicProcedure.query(() => {
        throw new TodoError('not_found')
      }),
    }).createCaller({ user: null, session: null })
    await expect(probe.missing()).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'not_found',
    })
  })
})
