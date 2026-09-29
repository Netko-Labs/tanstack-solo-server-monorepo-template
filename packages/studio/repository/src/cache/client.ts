import type { RedisClient } from 'bun'

export const CACHE_URL = process.env.CACHE_URL ?? ''

// Global `Bun.RedisClient`, not `import { RedisClient } from 'bun'`: Vite's client dependency
// scanner walks route files into this package and cannot resolve the `bun` specifier.
/** Each call is its own connection: a subscribed client can only run pub/sub commands. */
export function createCacheClient(): RedisClient {
  return new Bun.RedisClient(CACHE_URL)
}
