import type { Member, RoomEvent } from '@temp-repo/studio-domain'

export interface PresenceRecord {
  member: Member
  lastSeen: number
}

export type RoomListener = (event: RoomEvent) => void

/** Fan-out + presence for one process (Local) or all instances (Redis). */
export interface RoomBus {
  publish(roomId: string, event: RoomEvent): Promise<void>
  subscribe(roomId: string, listener: RoomListener): () => void
  join(roomId: string, member: Member): Promise<void>
  heartbeat(roomId: string, userId: string): Promise<void>
  leave(roomId: string, userId: string): Promise<void>
  members(roomId: string): Promise<Member[]>
}

export interface AsyncQueue<T> extends AsyncIterable<T> {
  push(item: T): void
}
