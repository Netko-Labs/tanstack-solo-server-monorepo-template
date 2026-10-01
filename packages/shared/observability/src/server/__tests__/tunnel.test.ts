import { afterAll, describe, expect, test } from 'bun:test'
import { handleSentryTunnel } from '../tunnel'

const SINK_PORT = 4796
const DSN = `http://pub@127.0.0.1:${SINK_PORT}/7`
const forwarded: string[] = []

const sink = Bun.serve({
  port: SINK_PORT,
  fetch(request) {
    const url = new URL(request.url)
    forwarded.push(`${url.pathname}${url.search}`)
    return Response.json({ id: 'ok' })
  },
})
afterAll(() => sink.stop(true))

const envelope = (dsn: string) =>
  [JSON.stringify({ dsn, sent_at: new Date().toISOString() }), '{"type":"event"}', '{}'].join('\n')

const post = (body: RequestInit['body'], headers: Record<string, string> = {}) =>
  new Request('http://app.test/api/monitor', { method: 'POST', body, headers })

describe('sentry tunnel', () => {
  test('an allowed DSN is forwarded to its envelope endpoint, matched after normalization', async () => {
    const res = await handleSentryTunnel(post(envelope(DSN)), {
      allowedDsns: [` http://pub:@127.0.0.1:${SINK_PORT}/7 `],
    })
    expect(res.status).toBe(200)
    expect(forwarded).toHaveLength(1)
    expect(forwarded[0]).toStartWith('/api/7/envelope/?')
    expect(forwarded[0]).toContain('sentry_key=pub')
  })

  test('a foreign DSN is refused', async () => {
    const foreign = `http://other@127.0.0.1:${SINK_PORT}/9`
    const res = await handleSentryTunnel(post(envelope(foreign)), { allowedDsns: [DSN] })
    expect(res.status).toBe(403)
  })

  test('a body over the cap is 413, declared or streamed', async () => {
    const big = envelope(DSN) + 'x'.repeat(64)
    const declared = post(big, { 'content-length': String(big.length) })
    expect((await handleSentryTunnel(declared, { allowedDsns: [DSN], maxBytes: 64 })).status).toBe(
      413,
    )
    const streamed = post(new Blob([big]).stream())
    expect((await handleSentryTunnel(streamed, { allowedDsns: [DSN], maxBytes: 64 })).status).toBe(
      413,
    )
  })

  test('garbage is 400; no allowed DSN means no tunnel', async () => {
    expect((await handleSentryTunnel(post('not an envelope'), { allowedDsns: [DSN] })).status).toBe(
      400,
    )
    expect((await handleSentryTunnel(post(envelope(DSN)), { allowedDsns: [] })).status).toBe(404)
  })
})
