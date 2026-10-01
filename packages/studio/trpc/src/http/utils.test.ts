import { describe, expect, test } from 'bun:test'
import { initTRPC } from '@trpc/server'
import { MAX_TRPC_BATCH_SIZE, MAX_TRPC_BODY_BYTES } from './constants'
import { createTRPCHttpHandler } from './utils'

const t = initTRPC.create()
let runs = 0
const router = t.router({
  hello: t.procedure.query(() => 'hi'),
  touch: t.procedure.mutation(() => {
    runs += 1
    return 'ok'
  }),
})

const handle = createTRPCHttpHandler({
  router,
  endpoint: '/api/trpc',
  createContext: async () => ({}),
  trustedOrigins: ['http://app.test'],
})

const post = (headers: Record<string, string>, body: RequestInit['body'] = '{}') =>
  handle(new Request('http://app.test/api/trpc/touch', { method: 'POST', headers, body }))

describe('tRPC HTTP edge', () => {
  test('a JSON POST from a trusted origin runs', async () => {
    const res = await post({ 'content-type': 'application/json', origin: 'http://app.test' })
    expect(res.status).toBe(200)
    const streamed = new Request('http://app.test/api/trpc/touch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: new Blob(['{}']).stream(),
    })
    expect(streamed.headers.get('content-length')).toBeNull()
    expect((await handle(streamed)).status).toBe(200)
  })

  test('a multipart form post is refused before the mutation runs', async () => {
    const before = runs
    const form = new FormData()
    form.set('x', '1')
    const res = await handle(
      new Request('http://app.test/api/trpc/touch', { method: 'POST', body: form }),
    )
    expect(res.status).toBe(415)
    expect(runs).toBe(before)
  })

  test('a foreign origin is refused; no origin passes', async () => {
    const foreign = await post({ 'content-type': 'application/json', origin: 'https://evil.test' })
    expect(foreign.status).toBe(403)
    const query = await handle(new Request('http://app.test/api/trpc/hello'))
    expect(query.status).toBe(200)
  })

  test('a body over the cap is 413, declared or streamed', async () => {
    const big = 'x'.repeat(MAX_TRPC_BODY_BYTES + 1)
    const declared = await post({
      'content-type': 'application/json',
      'content-length': String(big.length),
    })
    expect(declared.status).toBe(413)
    const streamed = await post({ 'content-type': 'application/json' }, new Blob([big]).stream())
    expect(streamed.status).toBe(413)
  })

  test('a batch over the cap is refused', async () => {
    const paths = Array.from({ length: MAX_TRPC_BATCH_SIZE + 1 }, () => 'hello').join(',')
    const res = await handle(new Request(`http://app.test/api/trpc/${paths}?batch=1`))
    expect(res.status).toBe(400)
  })
})
