import { createFileRoute } from '@tanstack/react-router'
import { createLogger, rootCause } from '@temp-repo/logger'
import { studioEnvConfig } from '@temp-repo/studio-config'
import type { createCacheClient } from '@temp-repo/studio-repository'

const PROBE_TIMEOUT_MS = 2_000

const logger = createLogger('health')

// Silent on success: Coolify probes every few seconds.
const probeFailed = (check: string, startTime: number) => (error: unknown) => {
  const { message, code } = rootCause(error)
  logger.warn(
    { check, err: message, errCode: code, elapsed: Date.now() - startTime },
    'health probe failed',
  )
  return 'unavailable' as const
}

const withTimeout = <T>(work: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), PROBE_TIMEOUT_MS)
  })
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer))
}

// One throwaway client per probe, closed either way: an unreachable Redis would otherwise
// keep it retrying in the background for every health request.
const probeCache = async (create: typeof createCacheClient) => {
  const startTime = Date.now()
  let client: ReturnType<typeof createCacheClient> | undefined
  try {
    client = create()
    await withTimeout(client.ping())
    return 'connected' as const
  } catch (error) {
    return probeFailed('cache', startTime)(error)
  } finally {
    client?.close()
  }
}

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        const startTime = Date.now()
        const { CACHE_URL, createCacheClient, db, sql } = await import(
          '@temp-repo/studio-repository'
        )

        const database = await withTimeout(db.execute(sql`SELECT 1`))
          .then(() => 'connected' as const)
          .catch(probeFailed('database', startTime))
        const cache = CACHE_URL ? await probeCache(createCacheClient) : ('disabled' as const)

        const healthy = database === 'connected' && cache !== 'unavailable'
        // Coolify's healthcheck reads the status code, not the body.
        return Response.json(
          {
            status: healthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            release: studioEnvConfig.observability.release,
            environment: studioEnvConfig.observability.environment,
            responseTime: Date.now() - startTime,
            checks: { database, cache },
          },
          { status: healthy ? 200 : 503 },
        )
      },
    },
  },
})
