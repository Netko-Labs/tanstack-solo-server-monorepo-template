import { webEnvConfig } from '@temp-repo/web-config'
import type { AssetPreloadConfig, ServerConfig } from '@temp-repo/web-domain'
import { convertGlobToRegExp } from './utils/asset-loader'

/**
 * ✧･ﾟ: *✧･ﾟ:* PRODUCTION SERVER CONFIGURATION *:･ﾟ✧*:･ﾟ✧
 *
 * Configuration for production server with static asset optimization (◕‿◕✿)
 */

/**
 * Get server configuration from environment (◕‿◕)
 */
export function getServerConfig(): ServerConfig {
  return {
    port: webEnvConfig.app.port,
    clientDirectory: './dist/client',
    serverEntryPoint: './dist/server/server.js',
  }
}

/**
 * Get asset preload configuration from environment variables ✨
 */
export function getAssetPreloadConfig(): AssetPreloadConfig {
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
