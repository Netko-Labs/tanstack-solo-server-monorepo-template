import { LocalRoomBus } from '../local'

export class DeafBus extends LocalRoomBus {
  override subscribe(): Promise<() => void> {
    return Promise.reject(new Error('bus down'))
  }
}
