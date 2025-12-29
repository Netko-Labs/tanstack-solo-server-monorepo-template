/**
 * ✧･ﾟ: *✧･ﾟ:* TANSTACK START SERVER LIBRARY *:･ﾟ✧*:･ﾟ✧
 *
 * A reusable library for running TanStack Start apps on Bun.
 * Supports both development and production modes! (◕‿◕✿)
 *
 * @example
 * ```typescript
 * import { createDevServer, createProductionServer } from '@glitch-cove/tanstack-start-server'
 *
 * const config = { port: 3000, isDev: true }
 *
 * if (config.isDev) {
 *   await createDevServer({ config })
 * } else {
 *   await createProductionServer({
 *     config,
 *     clientDirectory: './dist/client',
 *     serverEntryPoint: './dist/server/server.js',
 *   })
 * }
 * ```
 */

// Dev server
export { createDevServer, initializeViteServer, processRequestThroughVite } from './dev'
// Production server
export {
  compressDataIfAppropriate,
  computeEtag,
  convertGlobToRegExp,
  createCompositeGlobPattern,
  createProductionServer,
  createResponseHandler,
  isFileEligibleForPreloading,
  isMimeTypeCompressible,
  loadStaticAssets,
} from './prod'
// Types
export type {
  AssetMetadata,
  AssetPreloadConfig,
  DevServerOptions,
  DevServerResult,
  InMemoryAsset,
  Logger,
  PreloadResult,
  ProductionServerOptions,
  ServerResult,
  TanStackServerConfig,
  WebSocketHandler,
} from './types'

// Utilities
export { setupDevShutdown, setupProductionShutdown, setupTanStackStartEnv } from './utils'
