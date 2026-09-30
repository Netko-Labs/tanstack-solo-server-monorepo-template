import { EventEmitter } from 'node:events'
import type { Member, RoomEvent } from '@temp-repo/studio-domain'
import type { PresenceRecord, RoomBus, RoomListener } from './types'
import { aggregateMembers, isExpired } from './utils'

export class LocalRoomBus implements RoomBus {
  private readonly emitter = new EventEmitter()
  private readonly presence = new Map<string, Map<string, PresenceRecord>>()

  constructor() {
    this.emitter.setMaxListeners(0)
  }

  async publish(roomId: string, event: RoomEvent): Promise<void> {
    this.emitter.emit(roomId, event)
  }

  async subscribe(roomId: string, listener: RoomListener): Promise<() => void> {
    this.emitter.on(roomId, listener)
    return () => this.emitter.off(roomId, listener)
  }

  // Write first, decide after: concurrent join/leave of the same user converge on the
  // live connection count instead of racing on a read-then-write.
  async join(roomId: string, connectionId: string, member: Member): Promise<void> {
    this.roomOf(roomId).set(connectionId, { member, lastSeen: Date.now() })
    if (this.liveConnections(roomId, member.userId) === 1) {
      await this.publish(roomId, { type: 'join', member })
    }
  }

  async heartbeat(roomId: string, connectionId: string): Promise<void> {
    const record = this.presence.get(roomId)?.get(connectionId)
    if (record) record.lastSeen = Date.now()
  }

  async leave(roomId: string, connectionId: string): Promise<boolean> {
    const room = this.presence.get(roomId)
    const record = room?.get(connectionId)
    if (!room || !record) return false
    room.delete(connectionId)
    const last = this.liveConnections(roomId, record.member.userId) === 0
    if (last) await this.publish(roomId, { type: 'leave', userId: record.member.userId })
    return last
  }

  async members(roomId: string): Promise<Member[]> {
    return aggregateMembers(this.liveRecords(roomId), Date.now())
  }

  private liveConnections(roomId: string, userId: string): number {
    return this.liveRecords(roomId).filter((r) => r.member.userId === userId).length
  }

  private liveRecords(roomId: string): PresenceRecord[] {
    const room = this.presence.get(roomId)
    if (!room) return []
    const now = Date.now()
    for (const [id, record] of room) if (isExpired(record.lastSeen, now)) room.delete(id)
    if (room.size === 0) this.presence.delete(roomId)
    return [...room.values()]
  }

  private roomOf(roomId: string): Map<string, PresenceRecord> {
    let room = this.presence.get(roomId)
    if (!room) {
      room = new Map()
      this.presence.set(roomId, room)
    }
    return room
  }
}
