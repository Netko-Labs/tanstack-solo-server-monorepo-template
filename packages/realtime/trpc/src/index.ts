import { router } from './init'
import { roomRouter } from './routers/room'
import { todosRouter } from './routers/todos'

export const appRouter = router({
  todos: todosRouter,
  room: roomRouter,
})

export type AppRouter = typeof appRouter

export { createContext } from './init'
