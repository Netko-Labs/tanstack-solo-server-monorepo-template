import { studioEnvConfig } from '@temp-repo/studio-config'
import { appRouter, createContext, createTRPCWebSocketHooks } from '@temp-repo/studio-trpc'
import { defineWebSocketHandler } from 'nitro/h3'

const WS_PING_MS = 30_000
const WS_PONG_WAIT_MS = 5_000

// Mounted at /trpc-ws by the nitro plugin in vite.config.ts (dev + Bun build alike).
export default defineWebSocketHandler(
  createTRPCWebSocketHooks({
    router: appRouter,
    createContext,
    trustedOrigins: [studioEnvConfig.app.baseUrl, ...studioEnvConfig.auth.trustedOrigins],
    keepAlive: { pingMs: WS_PING_MS, pongWaitMs: WS_PONG_WAIT_MS },
  }),
)
