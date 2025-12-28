import { logger } from '@temp-repo/logger'
import { webEnvConfig } from '@temp-repo/web-config'
import type { Server } from 'bun'
import type { ViteDevServer } from 'vite'
import { createTRPCWebSocketHandler, upgradeToWebSocket } from '../utils/websocket'
import { processRequestThroughVite } from './utils/node-bridge'

/**
 * ✧･ﾟ: *✧･ﾟ:* BUN DEV SERVER *:･ﾟ✧*:･ﾟ✧
 *
 * Creates the main Bun HTTP server that proxies requests through
 * Vite middleware and TanStack Start, with WebSocket support for tRPC (◕‿◕✿)
 */

interface ServerOptions {
  vite: ViteDevServer
}

/**
 * Creates and starts the Bun dev server ✨
 * Bun-chan will serve all requests with lightning speed! ⚡(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
 */
export function createBunServer(options: ServerOptions): Server<unknown> {
  const { vite } = options
  const { port } = webEnvConfig.app

  // Create WebSocket handler for tRPC (◕‿◕✿)
  const websocket = createTRPCWebSocketHandler()

  const server = Bun.serve({
    port,

    async fetch(request, server) {
      const url = new URL(request.url)

      // Try to upgrade to WebSocket if it's a tRPC WebSocket request ✨
      if (upgradeToWebSocket(request, server)) {
        return // WebSocket upgrade handled
      }

      try {
        // Process the request through Vite → TanStack Start pipeline ヨシ!
        const response = await processRequestThroughVite(request, vite)
        return response
      } catch (error) {
        // Something went wrong (╥﹏╥)
        logger.error({ err: error, path: url.pathname }, '❌ Server error')

        return new Response('Internal Server Error', {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      }
    },

    // WebSocket handlers for tRPC subscriptions (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
    websocket,
  })

  logger.info({ port, url: `http://localhost:${port}` }, '🚀 Server started')

  return server
}
