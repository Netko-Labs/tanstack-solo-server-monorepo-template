import { afterAll, describe, expect, test } from 'bun:test'
import { trace } from '@opentelemetry/api'
import { activeTraceIds } from '@temp-repo/logger'
import { initServerTelemetry, shutdownTelemetry } from './init'
import { createOtlpLogStream } from './log-stream'
import { reportError } from './report-error'
import { withSpan } from './span'

const SINK_PORT = 4795
const hits: { path: string; contentType: string | null; key: string | null; body: string }[] = []

const sink = Bun.serve({
  port: SINK_PORT,
  async fetch(request) {
    let bytes = new Uint8Array(await request.arrayBuffer())
    if (request.headers.get('content-encoding') === 'gzip') bytes = Bun.gunzipSync(bytes)
    hits.push({
      path: new URL(request.url).pathname,
      contentType: request.headers.get('content-type'),
      key: request.headers.get('x-codewhiskers-key'),
      body: new TextDecoder().decode(bytes),
    })
    return Response.json({})
  },
})
afterAll(() => sink.stop(true))

const BASE = { serviceName: 'studio', release: 'r1', environment: 'staging' }
const logLine = (msg: string) =>
  JSON.stringify({
    level: 30,
    time: Date.now(),
    pid: 1,
    hostname: 'h',
    namespace: '[t]',
    msg,
    ...activeTraceIds(),
  })

async function exercise(): Promise<string> {
  const stream = createOtlpLogStream()
  let traceId = ''
  await withSpan('trpc.query probe', { 'trpc.path': 'probe' }, async () => {
    traceId = trace.getActiveSpan()?.spanContext().traceId ?? ''
    expect(activeTraceIds().trace_id).toBe(traceId || undefined)
    await Bun.sleep(5)
    stream.write(logLine('inside the span'))
    const fault = new Error('boom')
    reportError(fault, { tags: { transport: 'test' }, userId: 'u1' })
    reportError(fault)
    reportError(new Error('wrapper', { cause: fault }))
  })
  await shutdownTelemetry()
  return traceId
}

const eventsOf = (body: string) =>
  body
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))

describe('server telemetry', () => {
  test('with no config nothing leaves the process', async () => {
    initServerTelemetry(BASE)
    await exercise()
    expect(hits).toEqual([])
  })

  test('one event, its trace id on the span and the log, JSON over OTLP', async () => {
    initServerTelemetry({
      ...BASE,
      dsn: `http://pub@127.0.0.1:${SINK_PORT}/7`,
      otlp: {
        endpoint: `http://127.0.0.1:${SINK_PORT}/otlp/`,
        headers: { 'x-codewhiskers-key': 'abc' },
      },
    })
    const traceId = await exercise()
    expect(traceId).toMatch(/^[0-9a-f]{32}$/)

    const envelopes = hits.filter((hit) => hit.path === '/api/7/envelope/')
    const items = envelopes.flatMap((hit) => eventsOf(hit.body))
    const types = items.filter((item) => 'type' in item).map((item) => item.type)
    expect(types).toEqual(['event'])
    const event = items.find((item) => 'exception' in item)
    expect(event.contexts.trace.trace_id).toBe(traceId)
    expect(event.tags).toMatchObject({ transport: 'test', trace_id: traceId })
    expect(event).toMatchObject({ release: 'r1', environment: 'staging', user: { id: 'u1' } })

    const [logs] = hits.filter((hit) => hit.path === '/otlp/v1/logs')
    expect(logs?.contentType).toStartWith('application/json')
    expect(logs?.key).toBe('abc')
    const record = JSON.parse(logs?.body ?? '{}').resourceLogs[0].scopeLogs[0].logRecords[0]
    expect(record.traceId).toBe(traceId)
    expect(record.body.stringValue).toBe('inside the span')
    const keys = record.attributes.map((attribute: { key: string }) => attribute.key)
    expect(keys).toEqual(expect.arrayContaining(['namespace', 'release', 'deployment.environment']))
    expect(keys).not.toContain('pid')
    expect(keys).not.toContain('trace_id')
    expect(keys).not.toContain('span_id')

    const [traces] = hits.filter((hit) => hit.path === '/otlp/v1/traces')
    expect(traces?.contentType).toStartWith('application/json')
    expect(traces?.body).toContain(traceId)
    expect(traces?.body).toContain('trpc.query probe')
  })
})
