import type { Member } from '@temp-repo/studio-domain'
import { LocalRoomBus } from '../local'

export class SlowBus extends LocalRoomBus {
  constructor(
    private readonly delayMs: number,
    private readonly onHeartbeatDone: () => void,
  ) {
    super()
  }

  override async heartbeat(roomId: string, connectionId: string, member: Member): Promise<void> {
    await Bun.sleep(this.delayMs)
    await super.heartbeat(roomId, connectionId, member)
    this.onHeartbeatDone()
  }
}
