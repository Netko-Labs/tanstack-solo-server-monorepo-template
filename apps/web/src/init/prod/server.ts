import { logger } from '@temp-repo/logger'
import type { Server } from 'bun'
import { createTRPCWebSocketHandler, upgradeToWebSocket } from '../utils/websocket'
import { getAssetPreloadConfig, getServerConfig } from './config'
import { loadStaticAssets } from './utils/asset-loader'

/**
 * ✧･ﾟ: *✧･ﾟ:* PRODUCTION SERVER *:･ﾟ✧*:･ﾟ✧
 *
 * Production server with intelligent static asset loading and WebSocket support.
 * Combines TanStack Start SSR with optimized asset serving and tRPC subscriptions (◕‿◕✿)
 */

/**
 * Create and start production server ✨
 * Serves preloaded assets and handles SSR requests with WebSocket support! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
 */
export async function createProductionServer(): Promise<Server<unknown>> {
  logger.info('🚀 Starting Production Server')

  const config = getServerConfig()
  const assetConfig = getAssetPreloadConfig()

  // Load TanStack Start server handler ヨシ!
  let handler: { fetch: (request: Request) => Response | Promise<Response> }
  try {
    const serverModule = (await import(config.serverEntryPoint)) as {
      default: { fetch: (request: Request) => Response | Promise<Response> }
    }
    handler = serverModule.default
    logger.info('✨ TanStack Start application handler initialized')
  } catch (error) {
    logger.error({ err: error }, 'Failed to load server handler')
    process.exit(1)
  }

  // Build static routes with intelligent preloading (◕‿◕✿)
  logger.info(`📦 Loading static assets from ${config.clientDirectory}...`)
  const { routes, loaded, skipped } = await loadStaticAssets(
    config.clientDirectory,
    assetConfig,
    process.env.ASSET_PRELOAD_INCLUDE_PATTERNS,
  )

  // Log summary ✨
  if (loaded.length > 0) {
    const totalBytes = loaded.reduce((sum, file) => sum + file.size, 0)
    logger.info(
      `✅ Preloaded ${String(loaded.length)} files (${(totalBytes / 1024 / 1024).toFixed(2)} MB) into memory`,
    )
  } else {
    logger.info('ℹ️  No files preloaded into memory')
  }

  if (skipped.length > 0) {
    const tooLarge = skipped.filter((f) => f.size > assetConfig.maxPreloadBytes).length
    const filtered = skipped.length - tooLarge
    logger.info(
      `💾 ${String(skipped.length)} files will be served on-demand (${String(tooLarge)} too large, ${String(filtered)} filtered)`,
    )
  }

  // Create WebSocket handler for tRPC (◕‿◕✿)
  const websocket = createTRPCWebSocketHandler()

  // Create Bun production server (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
  const server = Bun.serve({
    port: config.port,

    fetch(request, server) {
      // Try to upgrade to WebSocket if it's a tRPC WebSocket request ✨
      if (upgradeToWebSocket(request, server)) {
        return // WebSocket upgrade handled
      }

      const url = new URL(request.url)
      const route = routes[url.pathname]

      // Serve static assets if route exists (◕‿◕)
      if (route) {
        return route(request)
      }

      // Fallback to TanStack Start handler ヨシ!
      try {
        return handler.fetch(request)
      } catch (error) {
        logger.error({ err: error }, 'Server handler error')
        return new Response('Internal Server Error', { status: 500 })
      }
    },

    // WebSocket handlers for tRPC subscriptions (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
    websocket,

    // Global error handler ダメ!
    error(error) {
      logger.error({ err: error instanceof Error ? error : String(error) }, 'Uncaught server error')
      return new Response('Internal Server Error', { status: 500 })
    },
  })

  logger.info(
    { port: server.port, url: `http://localhost:${String(server.port)}` },
    '🎉 Server started',
  )

  return server
}
