import { describe, expect, test } from 'bun:test'
import { initTRPC } from '@trpc/server'
import { createTRPCWebSocketHooks, MAX_SUBSCRIPTIONS_PER_PEER } from './utils'

const t = initTRPC.create()
const router = t.router({
  hello: t.procedure.query(() => 'hi'),
  ticks: t.procedure.subscription(async function* () {
    yield 1
    yield 2
  }),
})

function fakePeer(origin?: string, onSend?: (peer: { id: string }, data: string) => void) {
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
      onSend?.(this, String(data))
    },
    close() {
      this.closed = true
    },
    terminate() {
      this.closed = true
    },
  }
}

const hooks = createTRPCWebSocketHooks({
  router,
  createContext: async () => ({}),
  trustedOrigins: ['http://app.test:80/', 'HTTPS://Studio.Example'],
})

const until = async (check: () => boolean, ms = 1000) => {
  const deadline = Date.now() + ms
  while (!check()) {
    if (Date.now() > deadline) throw new Error('timeout')
    await Bun.sleep(10)
  }
}

describe('crossws ↔ tRPC bridge', () => {
  test('keepalive: a peer that answers PING stays open, a silent peer is terminated', async () => {
    const live = createTRPCWebSocketHooks({
      router,
      createContext: async () => ({}),
      trustedOrigins: [],
      keepAlive: { pingMs: 20, pongWaitMs: 20 },
    })
    const responsive = fakePeer(undefined, (peer, data) => {
      if (data === 'PING') live.message(peer as never, { text: () => 'PONG' })
    })
    const silent = fakePeer()
    live.open(responsive)
    live.open(silent)
    await Bun.sleep(120)
    expect(responsive.closed).toBe(false)
    expect(silent.closed).toBe(true)
    live.close(responsive)
    live.close(silent)
  })

  test('upgrade: trusted origin passes, foreign origin is 403, no origin passes', () => {
    expect(hooks.upgrade(fakePeer('http://app.test').request)).toBeUndefined()
    expect(hooks.upgrade(fakePeer('https://studio.example').request)).toBeUndefined()
    expect(hooks.upgrade(fakePeer('https://studio.example:444').request)?.status).toBe(403)
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

  test('subscription cap: finished streams free their slot; big query batches pass', async () => {
    const peer = fakePeer('http://app.test')
    hooks.open(peer)
    const subscribe = (id: number) =>
      hooks.message(peer, {
        text: () => JSON.stringify({ id, method: 'subscription', params: { path: 'ticks' } }),
      })
    for (let id = 1; id <= MAX_SUBSCRIPTIONS_PER_PEER * 2; id += 1) {
      subscribe(id)
      await until(() =>
        peer.sent.some((raw) => raw.includes(`"id":${id},"result":{"type":"stopped"}`)),
      )
    }
    expect(peer.closed).toBe(false)
    const batch = Array.from({ length: MAX_SUBSCRIPTIONS_PER_PEER + 4 }, (_, i) => ({
      id: 100 + i,
      method: 'query',
      params: { path: 'hello' },
    }))
    hooks.message(peer, { text: () => JSON.stringify(batch) })
    await until(() => peer.sent.filter((raw) => raw.includes('"hi"')).length === batch.length)
    expect(peer.closed).toBe(false)
    for (let id = 200; id <= 200 + MAX_SUBSCRIPTIONS_PER_PEER; id += 1) subscribe(id)
    expect(peer.closed).toBe(true)
  })

  test('subscription cap: any request reusing an in-flight id closes the socket', () => {
    const frame = (method: string) =>
      JSON.stringify({ id: 7, method, params: { path: method === 'query' ? 'hello' : 'ticks' } })
    const pairs = [
      ['subscription', 'subscription'],
      ['subscription', 'query'],
      ['query', 'subscription'],
    ] as const
    for (const [first, second] of pairs) {
      const peer = fakePeer('http://app.test')
      hooks.open(peer)
      hooks.message(peer, { text: () => frame(first) })
      expect(peer.closed).toBe(false)
      hooks.message(peer, { text: () => frame(second) })
      expect(peer.closed).toBe(true)
    }
  })

  test('subscription cap: a finished query frees its id for reuse', async () => {
    const peer = fakePeer('http://app.test')
    hooks.open(peer)
    const query = JSON.stringify({ id: 9, method: 'query', params: { path: 'hello' } })
    hooks.message(peer, { text: () => query })
    await until(() => peer.sent.some((raw) => raw.includes('"hi"')))
    hooks.message(peer, { text: () => query })
    await until(() => peer.sent.filter((raw) => raw.includes('"hi"')).length === 2)
    expect(peer.closed).toBe(false)
  })
})
