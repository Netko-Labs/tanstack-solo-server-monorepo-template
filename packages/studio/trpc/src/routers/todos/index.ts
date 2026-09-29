import { mergeRouters } from '../../init'
import { todosMutations } from './mutations'
import { todosQueries } from './queries'

export const todosRouter = mergeRouters(todosQueries, todosMutations)
