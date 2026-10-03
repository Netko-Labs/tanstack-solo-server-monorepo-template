import type { Member, RoomEvent } from '@temp-repo/studio-domain'

export interface PresenceRecord {
  member: Member
  lastSeen: number
}

export type RoomListener = (event: RoomEvent) => void
export type MemberStatus = Member['status']

/**
 * Fan-out + presence for one process (Local) or all instances (Redis). Presence is
 * tracked per connection (a user with two tabs is two connections) and read per user.
 */
export interface RoomBus {
  /** Best-effort: never rejects, since callers publish after persisting. */
  publish(roomId: string, event: RoomEvent): Promise<void>
  /** Resolves once the subscription is live, so nothing published afterwards is missed. */
  subscribe(roomId: string, listener: RoomListener): Promise<() => void>
  join(roomId: string, connectionId: string, member: Member): Promise<void>
  /** Refreshes liveness and re-asserts the record, healing a cleanup that raced this connection. */
  heartbeat(roomId: string, connectionId: string, member: Member): Promise<void>
  /** Resolves true when this was the user's last connection in the room. */
  leave(roomId: string, connectionId: string): Promise<boolean>
  /**
   * Client-reported status for one connection, refused unless it belongs to `userId`;
   * fans out a presence snapshot when it changed something.
   */
  setStatus(
    roomId: string,
    connectionId: string,
    userId: string,
    status: MemberStatus,
  ): Promise<boolean>
  members(roomId: string): Promise<Member[]>
  /** Fires after the transport recovered; events published meanwhile were lost. */
  onReconnect(listener: () => void): () => void
  close(): void
}

export interface AsyncQueue<T> extends AsyncIterable<T> {
  push(item: T): void
  size(): number
}

export type RoomSync = Extract<RoomEvent, { type: 'sync' }>

/** Room events plus an internal marker asking the consumer to take a fresh snapshot. */
export type RoomQueueItem = RoomEvent | { type: 'resync' }
