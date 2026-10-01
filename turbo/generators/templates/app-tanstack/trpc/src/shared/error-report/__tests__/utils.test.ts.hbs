import { describe, expect, mock, test } from 'bun:test'
import { initTRPC, TRPCError } from '@trpc/server'
import { createTRPCHttpHandler } from '../../../http'
import { reportInternalErrors } from '../utils'

const t = initTRPC.context<{ user: { id: string } }>().create()
const router = t.router({
  broken: t.procedure.query(() => {
    throw new Error('connection reset')
  }),
  signedOut: t.procedure.query(() => {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }),
  badInput: t.procedure.query(() => {
    throw new TRPCError({ code: 'BAD_REQUEST' })
  }),
})

const report = mock()
const handle = createTRPCHttpHandler({
  router,
  endpoint: '/api/trpc',
  createContext: async () => ({ user: { id: 'u1' } }),
  trustedOrigins: [],
  onError: reportInternalErrors('http', report),
})
const call = (path: string) => handle(new Request(`http://app.test/api/trpc/${path}`))

describe('reportInternalErrors', () => {
  test('a server fault is reported once, with its path and user', async () => {
    expect((await call('broken')).status).toBe(500)
    expect(report).toHaveBeenCalledTimes(1)
    const [error, scope] = report.mock.calls[0] ?? []
    expect(error).toBeInstanceOf(TRPCError)
    expect(scope).toEqual({
      tags: { transport: 'http', 'trpc.path': 'broken', 'trpc.type': 'query' },
      userId: 'u1',
    })
  })

  test('client mistakes and refusals are not reported', async () => {
    report.mockClear()
    expect((await call('signedOut')).status).toBe(401)
    expect((await call('badInput')).status).toBe(400)
    expect(report).not.toHaveBeenCalled()
  })
})
