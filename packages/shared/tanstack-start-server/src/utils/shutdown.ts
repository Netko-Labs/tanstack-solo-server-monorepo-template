import type { Server } from 'bun'
import type { ViteDevServer } from 'vite'
import type { Logger } from '../types'

/**
 * ✧･ﾟ: *✧･ﾟ:* GRACEFUL SHUTDOWN HANDLER *:･ﾟ✧*:･ﾟ✧
 *
 * Ensures proper cleanup when the server needs to stop.
 * Works for both dev and prod! Saying goodbye properly is important! (◕‿◕✿)
 */

/**
 * Default console logger (◕‿◕)
 */
const defaultLogger: Logger = {
  info: (obj, msg) => console.log(typeof obj === 'string' ? obj : msg ?? JSON.stringify(obj)),
  error: (obj, msg) => console.error(typeof obj === 'string' ? obj : msg ?? JSON.stringify(obj)),
  debug: (obj, msg) => console.debug(typeof obj === 'string' ? obj : msg ?? JSON.stringify(obj)),
  warn: (obj, msg) => console.warn(typeof obj === 'string' ? obj : msg ?? JSON.stringify(obj)),
}

/**
 * Sets up graceful shutdown handlers for production server ✨
 * Cleanup is important for a healthy system! ヨシ! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
 */
export function setupProductionShutdown(server: Server<unknown>, logger: Logger = defaultLogger): void {
  const shutdown = async (signal: string) => {
    logger.info({ signal }, '⏹️  Shutting down server...')
    server.stop()
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

/**
 * Sets up graceful shutdown handlers for dev server with Vite ✨
 * Takes care of both Bun and Vite! (◕‿◕✿)
 */
export function setupDevShutdown(
  server: Server<unknown>,
  vite: ViteDevServer,
  logger: Logger = defaultLogger,
): void {
  const shutdown = async (signal: string) => {
    logger.info({ signal }, '⏹️  Shutting down server...')
    server.stop()
    await vite.close()
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

