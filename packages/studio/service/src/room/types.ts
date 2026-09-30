import type { Member, RoomEvent } from '@temp-repo/studio-domain'

export interface PresenceRecord {
  member: Member
  lastSeen: number
}

export type RoomListener = (event: RoomEvent) => void

/**
 * Fan-out + presence for one process (Local) or all instances (Redis). Presence is
 * tracked per connection (a user with two tabs is two connections) and read per user.
 */
export interface RoomBus {
  publish(roomId: string, event: RoomEvent): Promise<void>
  subscribe(roomId: string, listener: RoomListener): () => void
  join(roomId: string, connectionId: string, member: Member): Promise<void>
  heartbeat(roomId: string, connectionId: string): Promise<void>
  /** Resolves true when this was the user's last connection in the room. */
  leave(roomId: string, connectionId: string): Promise<boolean>
  members(roomId: string): Promise<Member[]>
}

export interface AsyncQueue<T> extends AsyncIterable<T> {
  push(item: T): void
}
