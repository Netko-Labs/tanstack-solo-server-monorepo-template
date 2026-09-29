import { EventEmitter } from 'node:events'
import type { ChatMessage, Member, RoomEvent } from '@temp-repo/studio-domain'
import type { Room } from './types'

/**
 * In-memory room membership + fan-out. Presence is keyed by userId and dies with
 * the process; chat history is persisted separately via the repository.
 */
class RoomHub {
  private rooms = new Map<string, Room>()

  private roomOf(roomId: string): Room {
    let room = this.rooms.get(roomId)
    if (!room) {
      room = { emitter: new EventEmitter(), members: new Map() }
      room.emitter.setMaxListeners(0)
      this.rooms.set(roomId, room)
    }
    return room
  }

  on(roomId: string, cb: (event: RoomEvent) => void): () => void {
    const room = this.roomOf(roomId)
    room.emitter.on('event', cb)
    return () => {
      room.emitter.off('event', cb)
      this.gc(roomId)
    }
  }

  private emit(roomId: string, event: RoomEvent): void {
    this.rooms.get(roomId)?.emitter.emit('event', event)
  }

  join(roomId: string, member: Member): Member[] {
    const room = this.roomOf(roomId)
    room.members.set(member.userId, member)
    this.emit(roomId, { type: 'join', member })
    return [...room.members.values()]
  }

  leave(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId)
    if (!room) return
    room.members.delete(userId)
    this.emit(roomId, { type: 'leave', userId })
    this.gc(roomId)
  }

  members(roomId: string): Member[] {
    return [...(this.rooms.get(roomId)?.members.values() ?? [])]
  }

  chat(roomId: string, message: ChatMessage): void {
    this.emit(roomId, { type: 'chat', message })
  }

  private gc(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (room && room.members.size === 0 && room.emitter.listenerCount('event') === 0) {
      this.rooms.delete(roomId)
    }
  }
}

export const hub = new RoomHub()
