import type { Server } from 'bun'
import type { ViteDevServer } from 'vite'

/**
 * ✧･ﾟ: *✧･ﾟ:* TANSTACK START SERVER TYPES *:･ﾟ✧*:･ﾟ✧
 *
 * Type definitions for the TanStack Start server library (◕‿◕✿)
 */

/**
 * Basic server configuration ヨシ!
 */
export interface TanStackServerConfig {
  port: number
  isDev: boolean
}

/**
 * Logger interface for optional logging support (◕‿◕)
 */
export interface Logger {
  info: (obj: object | string, msg?: string) => void
  error: (obj: object | string, msg?: string) => void
  debug: (obj: object | string, msg?: string) => void
  warn: (obj: object | string, msg?: string) => void
}

/**
 * WebSocket handler type for Bun (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
 */
// biome-ignore lint/suspicious/noExplicitAny: Bun WebSocket handler types are complex
export type WebSocketHandler = any

/**
 * Options for development server ✨
 */
export interface DevServerOptions {
  config: TanStackServerConfig
  websocket?: WebSocketHandler
  logger?: Logger
}

/**
 * Options for production server 🚀
 */
export interface ProductionServerOptions {
  config: TanStackServerConfig
  clientDirectory: string
  serverEntryPoint: string
  assetConfig?: AssetPreloadConfig
  websocket?: WebSocketHandler
  logger?: Logger
}

/**
 * Configuration for asset preloading (◕‿◕)
 */
export interface AssetPreloadConfig {
  maxPreloadBytes: number
  includePatterns: RegExp[]
  excludePatterns: RegExp[]
  verbose: boolean
  enableEtag: boolean
  enableGzip: boolean
  gzipMinBytes: number
  gzipMimeTypes: string[]
}

/**
 * Metadata for static assets ✨
 */
export interface AssetMetadata {
  route: string
  size: number
  type: string
}

/**
 * In-memory asset with ETag and Gzip support (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
 */
export interface InMemoryAsset {
  raw: Uint8Array
  gz?: Uint8Array
  etag?: string
  type: string
  immutable: boolean
  size: number
}

/**
 * Result of static asset preloading process ヨシ!
 */
export interface PreloadResult {
  routes: Record<string, (req: Request) => Response | Promise<Response>>
  loaded: AssetMetadata[]
  skipped: AssetMetadata[]
}

/**
 * Server result from createDevServer or createProductionServer (◕‿◕✿)
 */
export interface ServerResult {
  server: Server<unknown>
  shutdown: () => Promise<void>
}

/**
 * Dev server result with Vite instance ✨
 */
export interface DevServerResult extends ServerResult {
  vite: ViteDevServer
}
