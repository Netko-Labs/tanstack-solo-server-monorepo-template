import { createFileRoute } from '@tanstack/react-router'
import type { createCacheClient } from '@temp-repo/studio-repository'

const PROBE_TIMEOUT_MS = 2_000

const withTimeout = <T>(work: Promise<T>): Promise<T> =>
  Promise.race([
    work,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), PROBE_TIMEOUT_MS)),
  ])

// One throwaway client per probe, closed either way: an unreachable Redis would otherwise
// keep it retrying in the background for every health request.
const probeCache = async (create: typeof createCacheClient) => {
  let client: ReturnType<typeof createCacheClient> | undefined
  try {
    client = create()
    await withTimeout(client.ping())
    return 'connected' as const
  } catch {
    return 'unavailable' as const
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
          .catch(() => 'unavailable' as const)
        const cache = CACHE_URL ? await probeCache(createCacheClient) : ('disabled' as const)

        const healthy = database === 'connected' && cache !== 'unavailable'
        // Coolify's healthcheck reads the status code, not the body.
        return Response.json(
          {
            status: healthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            responseTime: Date.now() - startTime,
            checks: { database, cache },
          },
          { status: healthy ? 200 : 503 },
        )
      },
    },
  },
})
