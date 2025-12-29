import type { DevServerOptions, DevServerResult, Logger } from '../types'
import { setupTanStackStartEnv } from '../utils/env-setup'
import { setupDevShutdown } from '../utils/shutdown'
import { processRequestThroughVite } from './node-bridge'
import { initializeViteServer } from './vite'

/**
 * ✧･ﾟ: *✧･ﾟ:* BUN DEV SERVER *:･ﾟ✧*:･ﾟ✧
 *
 * Creates the main Bun HTTP server that proxies requests through
 * Vite middleware and TanStack Start, with optional WebSocket support (◕‿◕✿)
 */

/**
 * Default console logger (◕‿◕)
 */
const defaultLogger: Logger = {
  info: (obj, msg) => console.log(typeof obj === 'string' ? obj : (msg ?? JSON.stringify(obj))),
  error: (obj, msg) => console.error(typeof obj === 'string' ? obj : (msg ?? JSON.stringify(obj))),
  debug: (obj, msg) => console.debug(typeof obj === 'string' ? obj : (msg ?? JSON.stringify(obj))),
  warn: (obj, msg) => console.warn(typeof obj === 'string' ? obj : (msg ?? JSON.stringify(obj))),
}

/**
 * Creates and starts the Bun dev server ✨
 * Bun-chan will serve all requests with lightning speed! ⚡(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
 */
export async function createDevServer(options: DevServerOptions): Promise<DevServerResult> {
  const { config, websocket, logger = defaultLogger } = options

  logger.info('\n✨ Starting development server with Vite + HMR...\n')

  // Step 1: Configure TanStack Start environment (◕‿◕)
  setupTanStackStartEnv()

  // Step 2: Initialize Vite dev server 🔥
  const vite = await initializeViteServer({ config, logger })

  // Step 3: Create Bun server ⚡
  const serverOptions: Parameters<typeof Bun.serve>[0] = {
    port: config.port,
    // Ensure websocket handler is always defined (required by Bun typings)
    ...(websocket && { websocket }),

    async fetch(request, server) {
      const url = new URL(request.url)

      // Try to upgrade to WebSocket if handler provided and it's a WebSocket request ✨
      if (websocket && request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
        const upgraded = server.upgrade(request, {
          data: { req: request },
        })
        if (upgraded) {
          return // WebSocket upgrade handled
        }
      }

      try {
        // Process the request through Vite → TanStack Start pipeline ヨシ!
        const response = await processRequestThroughVite(request, vite, config)
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
  }

  // Add WebSocket handler if provided (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
  if (websocket) {
    serverOptions.websocket = websocket
  }

  const server = Bun.serve(serverOptions)

  logger.info({ port: server.port, url: `http://localhost:${server.port}` }, '🚀 Server started')

  // Create shutdown function
  const shutdown = async () => {
    server.stop()
    await vite.close()
  }

  // Setup graceful shutdown handlers 👋
  setupDevShutdown(server, vite, logger)

  return { server, vite, shutdown }
}
