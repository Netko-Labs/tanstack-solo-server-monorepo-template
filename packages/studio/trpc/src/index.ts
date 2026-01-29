import { router } from './init'
import { authRouter } from './routers/auth'
import { chatRouter } from './routers/chat'
import { todosRouter } from './routers/todos'

export const appRouter = router({
  auth: authRouter,
  chat: chatRouter,
  todos: todosRouter,
})

export type AppRouter = typeof appRouter

// Re-export init utilities for use in the app
export { createContext, mergeRouters, protectedProcedure, publicProcedure, router } from './init'
