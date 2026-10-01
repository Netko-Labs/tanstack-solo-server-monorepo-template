import { LocalRoomBus } from '../local'

// A dead instance publishes nothing: its records just stop being live.
export class GhostBus extends LocalRoomBus {
  vanish(roomId: string, connectionId: string): void {
    this.presence.get(roomId)?.delete(connectionId)
  }
}
