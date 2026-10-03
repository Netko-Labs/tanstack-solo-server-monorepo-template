import { shutdownTelemetry } from '@temp-repo/observability/server'
import { closeDb } from '@temp-repo/studio-repository'
import { hub } from '@temp-repo/studio-service'
import { closeAllPeers } from '@temp-repo/studio-trpc'
import { definePlugin } from 'nitro'

const DRAIN_TIMEOUT_MS = 5_000

/**
 * Registered before srvx's own SIGTERM handler, so sockets close with 1001 and their
 * room leaves run while the HTTP server is still draining. Nitro's `close` hook fires
 * once the server is closed; only then do the Redis and Postgres clients go, and telemetry
 * flushes last so the leave events and final logs ship (bounded, ~2 s).
 */
export default definePlugin((nitroApp) => {
  const drain = () => {
    closeAllPeers(1001, 'server shutting down')
  }
  process.once('SIGTERM', drain)
  process.once('SIGINT', drain)

  nitroApp.hooks.hook('close', async () => {
    await hub.drain(DRAIN_TIMEOUT_MS)
    hub.bus.close()
    await closeDb()
    await shutdownTelemetry()
  })
})
