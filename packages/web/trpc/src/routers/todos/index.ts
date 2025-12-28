import { mergeRouters } from '../../init'
import { todosMutations } from './mutations'
import { todosQueries } from './queries'
import { todosSubscriptions } from './subscriptions'

export const todosRouter = mergeRouters(todosQueries, todosMutations, todosSubscriptions)
