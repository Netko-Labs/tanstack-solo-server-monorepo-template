import { describe, expect, test } from 'bun:test'
import { initTRPC } from '@trpc/server'
import {
  createTRPCWebSocketHooks,
  MAX_SUBSCRIPTIONS_PER_PEER,
  MAX_WS_MESSAGE_BYTES,
} from '../utils'

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
    closeCode: undefined as number | undefined,
    send(data: string | Uint8Array) {
      sent.push(String(data))
      onSend?.(this, String(data))
    },
    close(code?: number) {
      this.closed = true
      this.closeCode = code
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

  test('a message over the size cap closes the socket with 1009', () => {
    const peer = fakePeer('http://app.test')
    hooks.open(peer)
    hooks.message(peer, { text: () => 'é'.repeat(MAX_WS_MESSAGE_BYTES / 2 + 1) })
    expect(peer.closeCode).toBe(1009)
    hooks.close(peer)
  })

  test('logs a refused origin, socket open with the user, and close with its lifetime', async () => {
    const lines: { level: string; fields: Record<string, unknown>; message: string }[] = []
    const record = (level: string) => (fields: object, message: string) =>
      lines.push({ level, fields: fields as Record<string, unknown>, message })
    const logged = createTRPCWebSocketHooks({
      router,
      createContext: async () => ({ user: { id: 'u1', email: 'u1@example.com' } }),
      trustedOrigins: ['http://app.test'],
      logger: { info: record('info'), warn: record('warn') },
    })
    logged.upgrade(fakePeer('https://evil.example').request)
    expect(lines[0]).toEqual({
      level: 'warn',
      fields: { origin: 'https://evil.example' },
      message: 'socket origin refused',
    })
    const peer = fakePeer('http://app.test')
    logged.open(peer)
    await until(() => lines.length === 2)
    expect(lines[1]).toEqual({
      level: 'info',
      fields: { peer: peer.id, user: 'u1' },
      message: 'socket open',
    })
    logged.close(peer, { code: 1000, reason: '' })
    expect(lines[2]?.message).toBe('socket closed')
    expect(lines[2]?.fields).toMatchObject({ peer: peer.id, code: 1000 })
    expect(typeof lines[2]?.fields.lifetime).toBe('number')
  })

  test('onError reports a failing subscription with its type and the peer context', async () => {
    const ctx = { user: { id: 'u2' } }
    const tc = initTRPC.context<typeof ctx>().create()
    const failing = tc.router({
      boom: tc.procedure.subscription(async function* () {
        yield 1
        throw new Error('iterator failed')
      }),
    })
    const events: { type: string; path?: string; ctx?: unknown }[] = []
    const reporting = createTRPCWebSocketHooks({
      router: failing,
      createContext: async () => ctx,
      trustedOrigins: [],
      onError: ({ type, path, ctx }) => events.push({ type, path, ctx }),
    })
    const peer = fakePeer()
    reporting.open(peer)
    reporting.message(peer, {
      text: () => JSON.stringify({ id: 1, method: 'subscription', params: { path: 'boom' } }),
    })
    await until(() => events.length === 1)
    expect(events[0]).toEqual({ type: 'subscription', path: 'boom', ctx })
    reporting.close(peer)
  })
})
