import { describe, expect, test } from 'bun:test'
import { initTRPC } from '@trpc/server'
import { createTRPCWebSocketHooks } from './utils'

const t = initTRPC.create()
const router = t.router({
  hello: t.procedure.query(() => 'hi'),
  ticks: t.procedure.subscription(async function* () {
    yield 1
    yield 2
  }),
})

function fakePeer(origin?: string) {
  const sent: string[] = []
  const headers = new Headers({ host: 'app.test' })
  if (origin) headers.set('origin', origin)
  return {
    id: crypto.randomUUID(),
    request: new Request('http://app.test/trpc-ws', { headers }),
    sent,
    closed: false,
    send(data: string | Uint8Array) {
      sent.push(String(data))
    },
    close() {
      this.closed = true
    },
    terminate() {
      this.closed = true
    },
    ping() {},
  }
}

const hooks = createTRPCWebSocketHooks({
  router,
  createContext: async () => ({}),
  trustedOrigins: ['http://app.test/'],
})

const until = async (check: () => boolean, ms = 1000) => {
  const deadline = Date.now() + ms
  while (!check()) {
    if (Date.now() > deadline) throw new Error('timeout')
    await Bun.sleep(10)
  }
}

describe('crossws ↔ tRPC bridge', () => {
  test('upgrade: trusted origin passes, foreign origin is 403, no origin passes', () => {
    expect(hooks.upgrade(fakePeer('http://app.test').request)).toBeUndefined()
    expect(hooks.upgrade(fakePeer('https://evil.example').request)?.status).toBe(403)
    expect(hooks.upgrade(fakePeer().request)).toBeUndefined()
  })

  test('query round-trips through the stock tRPC protocol', async () => {
    const peer = fakePeer('http://app.test')
    hooks.open(peer)
    hooks.message(peer, {
      text: () => JSON.stringify({ id: 1, method: 'query', params: { path: 'hello' } }),
    })
    await until(() => peer.sent.length === 1)
    expect(JSON.parse(peer.sent[0] ?? '')).toEqual({ id: 1, result: { type: 'data', data: 'hi' } })
    hooks.close(peer)
  })

  test('subscription: started → data → stopped; PING answers PONG; silence after close', async () => {
    const peer = fakePeer('http://app.test')
    hooks.open(peer)
    hooks.message(peer, {
      text: () => JSON.stringify({ id: 2, method: 'subscription', params: { path: 'ticks' } }),
    })
    await until(() => peer.sent.length === 4)
    const types = peer.sent.map((raw) => JSON.parse(raw).result.type)
    expect(types).toEqual(['started', 'data', 'data', 'stopped'])
    hooks.message(peer, { text: () => 'PING' })
    await until(() => peer.sent.at(-1) === 'PONG')
    hooks.close(peer)
    const sentBeforeClose = peer.sent.length
    hooks.message(peer, { text: () => 'PING' })
    await Bun.sleep(20)
    expect(peer.sent.length).toBe(sentBeforeClose)
  })
})
