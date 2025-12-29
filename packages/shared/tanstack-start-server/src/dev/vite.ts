import type { ViteDevServer } from 'vite'
import type { Logger, TanStackServerConfig } from '../types'

/**
 * ✧･ﾟ: *✧･ﾟ:* VITE DEV SERVER INITIALIZER *:･ﾟ✧*:･ﾟ✧
 *
 * Creates and configures the Vite development server in middleware mode.
 * This allows Vite to handle HMR, asset transformation, and module resolution
 * while Bun handles the HTTP server (◕‿◕✿)
 */

interface ViteServerOptions {
  config: TanStackServerConfig
  logger?: Logger
}

/**
 * Initializes Vite in middleware mode ✨
 * Vite-chan will handle all the module transforms! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
 */
export async function initializeViteServer(options: ViteServerOptions): Promise<ViteDevServer> {
  const { config, logger } = options

  logger?.info('🔥 Starting Vite dev server...')

  const { createServer } = await import('vite')

  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: {
        port: config.port + 1, // HMR WebSocket gets its own port ヨシ!
      },
    },
    appType: 'custom',
  })

  logger?.info('✨ Vite dev server initialized')

  return vite
}

