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

  subscribe(roomId: string, listener: RoomListener): () => void {
    this.emitter.on(roomId, listener)
    return () => this.emitter.off(roomId, listener)
  }

  async join(roomId: string, connectionId: string, member: Member): Promise<void> {
    const wasPresent = this.hasUser(roomId, member.userId)
    this.roomOf(roomId).set(connectionId, { member, lastSeen: Date.now() })
    if (!wasPresent) await this.publish(roomId, { type: 'join', member })
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
    this.gc(roomId)
    const last = !this.hasUser(roomId, record.member.userId)
    if (last) await this.publish(roomId, { type: 'leave', userId: record.member.userId })
    return last
  }

  async members(roomId: string): Promise<Member[]> {
    const room = this.presence.get(roomId)
    if (!room) return []
    const now = Date.now()
    for (const [id, record] of room) if (isExpired(record.lastSeen, now)) room.delete(id)
    this.gc(roomId)
    return aggregateMembers([...room.values()], now)
  }

  private hasUser(roomId: string, userId: string): boolean {
    const room = this.presence.get(roomId)
    if (!room) return false
    for (const record of room.values()) if (record.member.userId === userId) return true
    return false
  }

  private roomOf(roomId: string): Map<string, PresenceRecord> {
    let room = this.presence.get(roomId)
    if (!room) {
      room = new Map()
      this.presence.set(roomId, room)
    }
    return room
  }

  private gc(roomId: string): void {
    if (this.presence.get(roomId)?.size === 0) this.presence.delete(roomId)
  }
}
