import { mergeRouters } from '../../init'
import { chatMutations } from './mutations'
import { chatQueries } from './queries'
import { chatSubscriptions } from './subscriptions'

export const chatRouter = mergeRouters(chatQueries, chatMutations, chatSubscriptions)
