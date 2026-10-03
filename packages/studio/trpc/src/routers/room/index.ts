import { mergeRouters } from '../../init'
import { roomMutations } from './mutations'
import { roomSubscriptions } from './subscriptions'

export const roomRouter = mergeRouters(roomMutations, roomSubscriptions)
