import * as path from 'node:path'
import { parseArgs } from 'node:util'
import { DEFAULT_SMOKE_PORT, FOREIGN_ORIGIN, SHUTDOWN_TIMEOUT_MS } from './constants'
import {
  assert,
  closeCode,
  field,
  openSocket,
  request,
  upgradeStatus,
  waitForHealth,
  withTimeout,
} from './utils'
import { TRPC_PROBES } from './values'

// Boots the built server the way a deploy does and probes HTTP and the socket.
// Run with `bun run repo test:smoke --app <name>` after `bun run repo build --app <name>`.

const { values: args } = parseArgs({
  options: {
    app: { type: 'string', default: 'studio' },
    port: { type: 'string', default: String(DEFAULT_SMOKE_PORT) },
  },
})
const app = args.app ?? 'studio'
const port = Number(args.port)
const baseUrl = `http://127.0.0.1:${port}`
const databaseUrl = process.env.DATABASE_URL ?? ''
const cacheUrl = process.env.CACHE_URL ?? ''

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is required: production refuses to boot without it')
  process.exit(1)
}

const output: string[] = []
const server = Bun.spawn(
  [
    'bun',
    '--no-install',
    path.join(import.meta.dir, '..', 'apps', app, '.output/server/index.mjs'),
  ],
  {
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      NODE_ENV: 'production',
      PORT: String(port),
      BASE_URL: baseUrl,
      DATABASE_URL: databaseUrl,
      CACHE_URL: cacheUrl,
      AUTH_SECRET: crypto.randomUUID() + crypto.randomUUID(),
      RESEND_API_KEY: 're_smoke_never_sends',
      // srvx skips its SIGTERM drain when CI is set, and GitHub sets it.
      CI: '',
    },
    stdout: 'pipe',
    stderr: 'pipe',
  },
)
collect(server.stdout)
collect(server.stderr)

async function collect(stream: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder()
  for await (const chunk of stream) output.push(decoder.decode(chunk))
}

async function check<T>(name: string, run: () => Promise<T>): Promise<T> {
  try {
    const result = await run()
    console.log(`  ✓ ${name}`)
    return result
  } catch (error) {
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`)
    if (server.exitCode === null) server.kill('SIGKILL')
    await server.exited
    console.error(`--- server output ---\n${output.join('')}`)
    return process.exit(1)
  }
}

async function stopsCleanly(socket?: WebSocket) {
  const closed = socket ? closeCode(socket) : Promise.resolve(1001)
  server.kill('SIGTERM')
  const code = await withTimeout(server.exited, SHUTDOWN_TIMEOUT_MS, 'no exit after SIGTERM')
  assert(code === 0, `exit code ${code}`)
  assert((await closed) === 1001, 'the open socket was not closed with 1001')
}

console.log(`🔥 smoke: ${app} on :${port}`)

await check('health reports its services', async () => {
  const health = await waitForHealth(baseUrl, () => server.exitCode)
  assert(health.checks?.database === 'connected', 'database is not connected', health)
  const cache = cacheUrl ? 'connected' : 'disabled'
  assert(health.checks?.cache === cache, `cache is not ${cache}`, health)
})

await check('SSR renders the home page', async () => {
  const res = await fetch(`${baseUrl}/`)
  assert(res.status === 200, `GET / answered ${res.status}`)
  assert(res.headers.get('content-type')?.includes('text/html'), 'GET / is not HTML')
  assert((await res.text()).includes('<html'), 'GET / has no document')
})

await check('a foreign Origin cannot open the socket', async () => {
  const status = await upgradeStatus(port, FOREIGN_ORIGIN)
  assert(status === 403, `the upgrade answered ${status}`)
})

const probes = TRPC_PROBES[app]
if (!probes) {
  console.log(`ℹ️  no tRPC probes for ${app}: add its paths to TRPC_PROBES in __tests__/values.ts`)
  await check('SIGTERM exits 0', () => stopsCleanly())
} else {
  await check('an anonymous protected query is 401 over HTTP', async () => {
    const res = await fetch(`${baseUrl}/api/trpc/${probes.protectedQuery}`)
    assert(res.status === 401, `${probes.protectedQuery} answered ${res.status}`)
  })

  const socket = await check('a trusted Origin opens the socket', () =>
    openSocket(`ws://127.0.0.1:${port}/trpc-ws`, baseUrl),
  )

  await check('a query round-trips over the socket', async () => {
    const frame = await request(socket, {
      id: 1,
      method: 'query',
      params: { path: probes.publicQuery, input: { json: undefined } },
    })
    assert(field(frame, 'result') !== undefined, `${probes.publicQuery} returned no result`, frame)
  })

  const { guardedStream, streamInput } = probes
  if (guardedStream) {
    await check('an anonymous subscription is refused', async () => {
      const frame = await request(socket, {
        id: 2,
        method: 'subscription',
        params: { path: guardedStream, input: { json: streamInput } },
      })
      const error = field(frame, 'error')
      const code = field(field(field(error, 'json') ?? error, 'data'), 'code')
      assert(code === 'UNAUTHORIZED', `${guardedStream} was not refused`, frame)
    })
  }

  await check('SIGTERM closes the socket with 1001 and exits 0', () => stopsCleanly(socket))
}

console.log(`✅ smoke passed for ${app}`)
