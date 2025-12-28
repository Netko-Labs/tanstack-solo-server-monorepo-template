import path from 'node:path'
import type {
  AssetMetadata,
  AssetPreloadConfig,
  InMemoryAsset,
  PreloadResult,
} from '@temp-repo/w-domain'

/**
 * ✧･ﾟ: *✧･ﾟ:* STATIC ASSET LOADER *:･ﾟ✧*:･ﾟ✧
 *
 * Intelligent static asset loading with configurable memory management.
 * Small files are preloaded, large files are served on-demand (◕‿◕✿)
 */

/**
 * Convert a simple glob pattern to a regular expression ✨
 * Supports * wildcard for matching any characters
 */
export function convertGlobToRegExp(globPattern: string): RegExp {
  const escapedPattern = globPattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escapedPattern}$`, 'i')
}

/**
 * Compute ETag for a given data buffer (◕‿◕✿)
 */
export function computeEtag(data: Uint8Array): string {
  const hash = Bun.hash(data)
  return `W/"${hash.toString(16)}-${data.byteLength.toString()}"`
}

/**
 * Check if a file is eligible for preloading based on configured patterns ヨシ!
 */
export function isFileEligibleForPreloading(
  relativePath: string,
  config: AssetPreloadConfig,
): boolean {
  const fileName = relativePath.split(/[/\\]/).pop() ?? relativePath

  // If include patterns are specified, file must match at least one
  if (config.includePatterns.length > 0) {
    if (!config.includePatterns.some((pattern) => pattern.test(fileName))) {
      return false
    }
  }

  // If exclude patterns are specified, file must not match any
  if (config.excludePatterns.some((pattern) => pattern.test(fileName))) {
    return false
  }

  return true
}

/**
 * Check if a MIME type is compressible (◕‿◕)
 */
export function isMimeTypeCompressible(mimeType: string, gzipTypes: string[]): boolean {
  return gzipTypes.some((type) =>
    type.endsWith('/') ? mimeType.startsWith(type) : mimeType === type,
  )
}

/**
 * Conditionally compress data based on size and MIME type ✨
 */
export function compressDataIfAppropriate(
  data: Uint8Array,
  mimeType: string,
  config: AssetPreloadConfig,
): Uint8Array | undefined {
  if (!config.enableGzip) return undefined
  if (data.byteLength < config.gzipMinBytes) return undefined
  if (!isMimeTypeCompressible(mimeType, config.gzipMimeTypes)) return undefined
  try {
    return Bun.gzipSync(data.buffer as ArrayBuffer)
  } catch {
    return undefined
  }
}

/**
 * Create response handler function with ETag and Gzip support (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
 */
export function createResponseHandler(
  asset: InMemoryAsset,
  enableEtag: boolean,
  enableGzip: boolean,
): (req: Request) => Response {
  return (req: Request) => {
    const headers: Record<string, string> = {
      'Content-Type': asset.type,
      'Cache-Control': asset.immutable
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600',
    }

    if (enableEtag && asset.etag) {
      const ifNone = req.headers.get('if-none-match')
      if (ifNone && ifNone === asset.etag) {
        return new Response(null, {
          status: 304,
          headers: { ETag: asset.etag },
        })
      }
      headers.ETag = asset.etag
    }

    if (enableGzip && asset.gz && req.headers.get('accept-encoding')?.includes('gzip')) {
      headers['Content-Encoding'] = 'gzip'
      headers['Content-Length'] = String(asset.gz.byteLength)
      const gzCopy = new Uint8Array(asset.gz)
      return new Response(gzCopy, { status: 200, headers })
    }

    headers['Content-Length'] = String(asset.raw.byteLength)
    const rawCopy = new Uint8Array(asset.raw)
    return new Response(rawCopy, { status: 200, headers })
  }
}

/**
 * Create composite glob pattern from include patterns ✨
 */
export function createCompositeGlobPattern(includePatterns?: string): Bun.Glob {
  const raw = (includePatterns ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (raw.length === 0) return new Bun.Glob('**/*')
  if (raw.length === 1) return new Bun.Glob(raw[0])
  return new Bun.Glob(`{${raw.join(',')}}`)
}

/**
 * Initialize static routes with intelligent preloading strategy ヨシ!
 * Small files are loaded into memory, large files are served on-demand (◕‿◕✿)
 */
export async function loadStaticAssets(
  clientDirectory: string,
  config: AssetPreloadConfig,
  includePatterns?: string,
): Promise<PreloadResult> {
  const routes: Record<string, (req: Request) => Response | Promise<Response>> = {}
  const loaded: AssetMetadata[] = []
  const skipped: AssetMetadata[] = []

  try {
    const glob = createCompositeGlobPattern(includePatterns)
    for await (const relativePath of glob.scan({ cwd: clientDirectory })) {
      const filepath = path.join(clientDirectory, relativePath)
      const route = `/${relativePath.split(path.sep).join(path.posix.sep)}`

      try {
        const file = Bun.file(filepath)

        if (!(await file.exists()) || file.size === 0) {
          continue
        }

        const metadata: AssetMetadata = {
          route,
          size: file.size,
          type: file.type || 'application/octet-stream',
        }

        const matchesPattern = isFileEligibleForPreloading(relativePath, config)
        const withinSizeLimit = file.size <= config.maxPreloadBytes

        if (matchesPattern && withinSizeLimit) {
          // Preload into memory with ETag and Gzip support ✨
          const bytes = new Uint8Array(await file.arrayBuffer())
          const gz = compressDataIfAppropriate(bytes, metadata.type, config)
          const etag = config.enableEtag ? computeEtag(bytes) : undefined
          const asset: InMemoryAsset = {
            raw: bytes,
            gz,
            etag,
            type: metadata.type,
            immutable: true,
            size: bytes.byteLength,
          }
          routes[route] = createResponseHandler(asset, config.enableEtag, config.enableGzip)

          loaded.push({ ...metadata, size: bytes.byteLength })
        } else {
          // Serve on-demand from disk (◕‿◕)
          routes[route] = () => {
            const fileOnDemand = Bun.file(filepath)
            return new Response(fileOnDemand, {
              headers: {
                'Content-Type': metadata.type,
                'Cache-Control': 'public, max-age=3600',
              },
            })
          }

          skipped.push(metadata)
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'EISDIR') {
          console.error(`Failed to load ${filepath}: ${error.message}`)
        }
      }
    }
  } catch (error) {
    console.error(`Failed to load static files from ${clientDirectory}: ${String(error)}`)
  }

  return { routes, loaded, skipped }
}
