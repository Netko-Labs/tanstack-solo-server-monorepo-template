import type { EventEmitter } from 'node:events'
import type { Member } from '@temp-repo/studio-domain'

export interface Room {
  emitter: EventEmitter
  members: Map<string, Member>
}
