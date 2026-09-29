import { RedisClient } from 'bun'

export const CACHE_URL = process.env.CACHE_URL ?? ''

/** Each call is its own connection: a subscribed client can only run pub/sub commands. */
export function createCacheClient(): RedisClient {
  return new RedisClient(CACHE_URL)
}
