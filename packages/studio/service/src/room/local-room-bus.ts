import { EventEmitter } from 'node:events'
import type { Member, RoomEvent } from '@temp-repo/studio-domain'
import type { PresenceRecord, RoomBus, RoomListener } from './types'
import { isExpired, withStatus } from './utils'

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

  async join(roomId: string, member: Member): Promise<void> {
    this.roomOf(roomId).set(member.userId, { member, lastSeen: Date.now() })
    await this.publish(roomId, { type: 'join', member })
  }

  async heartbeat(roomId: string, userId: string): Promise<void> {
    const record = this.presence.get(roomId)?.get(userId)
    if (record) record.lastSeen = Date.now()
  }

  async leave(roomId: string, userId: string): Promise<void> {
    const room = this.presence.get(roomId)
    if (!room?.delete(userId)) return
    if (room.size === 0) this.presence.delete(roomId)
    await this.publish(roomId, { type: 'leave', userId })
  }

  async members(roomId: string): Promise<Member[]> {
    const room = this.presence.get(roomId)
    if (!room) return []
    const now = Date.now()
    for (const [userId, record] of room) if (isExpired(record.lastSeen, now)) room.delete(userId)
    return [...room.values()].map((r) => withStatus(r.member, r.lastSeen, now))
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
