import { createLogger } from '@temp-repo/logger'
import { realtimeEnvConfig } from '@temp-repo/realtime-config'
import { appRouter, createContext } from '@temp-repo/realtime-trpc'
import { createBunHonoWSHandler } from '@valkyrie-resistance/trpc-ws-hono-bun-adapter'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

/**
 * Thin Hono + Bun entry: the standalone realtime server. Transactional ops and
 * the presence/chat room are all tRPC over a single WebSocket (`/trpc-ws`).
 * Auth rides `connectionParams.token` (a studio-minted JWT, verified via JWKS).
 */
const logger = createLogger('realtime')

const app = new Hono()
app.use('*', cors({ origin: realtimeEnvConfig.app.cors, credentials: true }))
app.get('/health', (c) => c.json({ status: 'ok' }))

const { wsRouter, websocket } = createBunHonoWSHandler({
  router: appRouter,
  createContext,
  onError: ({ error, path, type }) => {
    logger.error({ path, type, err: error.message }, `tRPC-WS error: ${error.message}`)
  },
})
app.route('/trpc-ws', wsRouter)

const port = realtimeEnvConfig.app.port
logger.info(`🚀 realtime server listening on http://localhost:${port} (ws: /trpc-ws)`)

export default {
  port,
  fetch: app.fetch,
  websocket,
}
