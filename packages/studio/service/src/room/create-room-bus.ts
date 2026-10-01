import { createLogger } from '@temp-repo/logger'
import { CACHE_URL, createCacheClient } from '@temp-repo/studio-repository'
import { LocalRoomBus } from './local'
import { RedisRoomBus } from './redis'
import type { RoomBus } from './types'

const logger = createLogger('room')

export function createRoomBus(): RoomBus {
  if (!CACHE_URL) return new LocalRoomBus()
  logger.info('room bus: redis')
  return new RedisRoomBus(createCacheClient(), createCacheClient())
}
