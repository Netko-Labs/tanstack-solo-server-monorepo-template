import type { RedisClient } from 'bun'

export const CACHE_URL = process.env.CACHE_URL ?? ''
const CONNECTION_TIMEOUT_MS = 10_000
// Bun stops reconnecting after `maxRetries` and never tries again; an outage longer than
// the default budget (~30 s) would kill the bus for the life of the process.
const MAX_RETRIES = 1_000_000

// Global `Bun.RedisClient`, not `import { RedisClient } from 'bun'`: Vite's client dependency
// scanner walks route files into this package and cannot resolve the `bun` specifier.
/** Each call is its own connection: a subscribed client can only run pub/sub commands. */
export function createCacheClient(): RedisClient {
  return new Bun.RedisClient(CACHE_URL, {
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    maxRetries: MAX_RETRIES,
  })
}
