import { router } from './init'
import { authRouter } from './routers/auth'
import { roomRouter } from './routers/room'
import { todosRouter } from './routers/todos'

export const appRouter = router({
  auth: authRouter,
  room: roomRouter,
  todos: todosRouter,
})

export type AppRouter = typeof appRouter

export { hub } from '@temp-repo/studio-service'
export { createContext, mergeRouters, protectedProcedure, publicProcedure, router } from './init'
export { closeAllPeers, createTRPCWebSocketHooks } from './ws'
