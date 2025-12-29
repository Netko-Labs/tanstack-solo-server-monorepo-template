import type { AssetPreloadConfig, Logger, ProductionServerOptions, ServerResult } from '../types'
import { setupProductionShutdown } from '../utils/shutdown'
import { convertGlobToRegExp, loadStaticAssets } from './asset-loader'

/**
 * ✧･ﾟ: *✧･ﾟ:* PRODUCTION SERVER *:･ﾟ✧*:･ﾟ✧
 *
 * Production server with intelligent static asset loading and optional WebSocket support.
 * Combines TanStack Start SSR with optimized asset serving (◕‿◕✿)
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
 * Get default asset preload configuration from environment variables ✨
 */
export function getDefaultAssetPreloadConfig(): AssetPreloadConfig {
  // Parse include patterns
  const includePatterns = (process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pattern: string) => convertGlobToRegExp(pattern))

  // Parse exclude patterns
  const excludePatterns = (process.env.ASSET_PRELOAD_EXCLUDE_PATTERNS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pattern: string) => convertGlobToRegExp(pattern))

  // Parse gzip MIME types
  const gzipMimeTypes = (
    process.env.ASSET_PRELOAD_GZIP_MIME_TYPES ??
    'text/,application/javascript,application/json,application/xml,image/svg+xml'
  )
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  return {
    maxPreloadBytes: Number(process.env.ASSET_PRELOAD_MAX_SIZE ?? 5 * 1024 * 1024), // 5MB default
    includePatterns,
    excludePatterns,
    verbose: process.env.ASSET_PRELOAD_VERBOSE_LOGGING === 'true',
    enableEtag: (process.env.ASSET_PRELOAD_ENABLE_ETAG ?? 'true') === 'true',
    enableGzip: (process.env.ASSET_PRELOAD_ENABLE_GZIP ?? 'true') === 'true',
    gzipMinBytes: Number(process.env.ASSET_PRELOAD_GZIP_MIN_SIZE ?? 1024), // 1KB
    gzipMimeTypes,
  }
}

/**
 * Create and start production server ✨
 * Serves preloaded assets and handles SSR requests with optional WebSocket support! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
 */
export async function createProductionServer(
  options: ProductionServerOptions,
): Promise<ServerResult> {
  const {
    config,
    clientDirectory,
    serverEntryPoint,
    assetConfig = getDefaultAssetPreloadConfig(),
    websocket,
    logger = defaultLogger,
  } = options

  logger.info('🚀 Starting Production Server')

  // Load TanStack Start server handler ヨシ!
  let handler: { fetch: (request: Request) => Response | Promise<Response> }
  try {
    const serverModule = (await import(serverEntryPoint)) as {
      default: { fetch: (request: Request) => Response | Promise<Response> }
    }
    handler = serverModule.default
    logger.info('✨ TanStack Start application handler initialized')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Failed to load server handler: ${errorMessage}`)
    process.exit(1)
  }

  // Build static routes with intelligent preloading (◕‿◕✿)
  logger.info(`📦 Loading static assets from ${clientDirectory}...`)
  const { routes, loaded, skipped } = await loadStaticAssets(
    clientDirectory,
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

  // Create Bun production server (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
  const serverOptions: any = {
    port: config.port,

    fetch(request: Request, server: any) {
      // Try to upgrade to WebSocket if handler provided and it's a WebSocket request ✨
      if (websocket && request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
        const upgraded = server.upgrade(request, {
          data: { req: request },
        })
        if (upgraded) {
          return // WebSocket upgrade handled
        }
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

    // Global error handler ダメ!
    error(error: any) {
      logger.error({ err: error instanceof Error ? error : String(error) }, 'Uncaught server error')
      return new Response('Internal Server Error', { status: 500 })
    },
  }

  // Add WebSocket handler if provided (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
  if (websocket) {
    serverOptions.websocket = websocket
  }

  const server = Bun.serve(serverOptions)

  logger.info(
    { port: server.port, url: `http://localhost:${String(server.port)}` },
    '🎉 Server started',
  )

  // Create shutdown function
  const shutdown = async () => {
    server.stop()
  }

  // Setup graceful shutdown handlers 👋
  setupProductionShutdown(server, logger)

  return { server, shutdown }
}
