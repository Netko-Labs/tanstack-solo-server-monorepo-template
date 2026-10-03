import { LocalRoomBus } from '../local'
import type { RoomBus } from '../types'

export class ReconnectableBus extends LocalRoomBus implements RoomBus {
  private readonly reconnectListeners = new Set<() => void>()

  override onReconnect(listener: () => void): () => void {
    this.reconnectListeners.add(listener)
    return () => this.reconnectListeners.delete(listener)
  }

  fireReconnect(): void {
    for (const listener of this.reconnectListeners) listener()
  }
}
