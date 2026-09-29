import { appRouter, createContext, createTRPCWebSocketHooks } from '@temp-repo/studio-trpc'
import { defineWebSocketHandler } from 'nitro/h3'

// Mounted at /trpc-ws by the nitro plugin in vite.config.ts (dev + Bun build alike).
export default defineWebSocketHandler(
  createTRPCWebSocketHooks({ router: appRouter, createContext }),
)
