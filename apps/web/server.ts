/**
 * ✧･ﾟ: *✧･ﾟ:* TEMP-REPO UNIFIED SERVER *:･ﾟ✧*:･ﾟ✧
 *
 * A magical server that adapts to its environment! (◕‿◕✿)
 *
 * Development Mode:
 * - ⚡ Bun - Lightning fast JavaScript runtime
 * - 🔥 Vite - Next generation frontend tooling with HMR
 * - 🎯 TanStack Start - Modern React meta-framework
 * - 🌉 fetch-to-node - Bridges Bun's Fetch API with Node.js HTTP
 *
 * Production Mode:
 * - 🚀 Optimized static asset serving (preload + on-demand)
 * - 💾 Intelligent memory management
 * - ✨ ETag support for caching
 * - 🗜️ Gzip compression
 * - 📦 TanStack Start SSR
 *
 * Based on: https://github.com/oven-sh/bun/issues/12212
 */
import { join } from 'node:path'
import { logger } from '@temp-repo/logger'
import { createDevServer, createProductionServer } from '@temp-repo/tanstack-start-server'
import { webEnvConfig } from '@temp-repo/web-config'
import { createTRPCWebSocketHandler } from './src/integrations/trpc/websocket'

/**
 * 🌟 MAIN SERVER STARTUP SEQUENCE 🌟
 * Detects environment and starts the appropriate server! ヨシ! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
 */
async function startServer() {
  const isDev = webEnvConfig.app.dev
  const config = { port: webEnvConfig.app.port, isDev }
  const websocket = createTRPCWebSocketHandler()

  if (isDev) {
    // 🔥 Development Mode - Vite + HMR magic! (◕‿◕✿)
    await createDevServer({ config, websocket, logger })
  } else {
    // 🚀 Production Mode - Optimized asset serving! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
    const cwd = process.cwd()
    await createProductionServer({
      config,
      clientDirectory: join(cwd, 'dist', 'client'),
      serverEntryPoint: join(cwd, 'dist', 'server', 'server.js'),
      websocket,
      logger,
    })
  }
}

// ✨ Let the magic begin! ✨
startServer().catch((error) => {
  console.error('💥 Failed to start server:', error)
  process.exit(1)
})
