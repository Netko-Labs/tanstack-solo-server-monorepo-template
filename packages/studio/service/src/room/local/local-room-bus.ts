import { EventEmitter } from 'node:events'
import { createLogger } from '@temp-repo/logger'
import type { Member, RoomEvent } from '@temp-repo/studio-domain'
import type { MemberStatus, PresenceRecord, RoomBus, RoomListener } from '../types'
import { aggregateMembers, isExpired } from '../utils'

const logger = createLogger('room-bus')

export class LocalRoomBus implements RoomBus {
  private readonly emitter = new EventEmitter()
  protected readonly presence = new Map<string, Map<string, PresenceRecord>>()

  constructor() {
    this.emitter.setMaxListeners(0)
  }

  // Best-effort like the Redis bus: a throwing listener neither rejects the publish (the message
  // is already saved) nor starves the listeners after it, which emit() would.
  async publish(roomId: string, event: RoomEvent): Promise<void> {
    for (const listener of this.emitter.listeners(roomId)) {
      try {
        listener(event)
      } catch (err) {
        logger.warn({ err: String(err), roomId, type: event.type }, 'listener failed')
      }
    }
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

  // Fresh details, stored status: the client owns status, the session owns the rest.
  async heartbeat(roomId: string, connectionId: string, member: Member): Promise<void> {
    const current = this.presence.get(roomId)?.get(connectionId)?.member
    const next = current ? { ...member, status: current.status } : member
    this.roomOf(roomId).set(connectionId, { member: next, lastSeen: Date.now() })
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

  async setStatus(
    roomId: string,
    connectionId: string,
    userId: string,
    status: MemberStatus,
  ): Promise<boolean> {
    const record = this.presence.get(roomId)?.get(connectionId)
    if (!record || record.member.userId !== userId) return false
    record.member = { ...record.member, status }
    await this.publish(roomId, { type: 'presence', members: await this.members(roomId) })
    return true
  }

  async members(roomId: string): Promise<Member[]> {
    return aggregateMembers(this.liveRecords(roomId))
  }

  onReconnect(_listener: () => void): () => void {
    return () => {}
  }

  close(): void {
    this.emitter.removeAllListeners()
    this.presence.clear()
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
