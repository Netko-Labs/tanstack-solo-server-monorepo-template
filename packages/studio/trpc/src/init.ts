import { createLogger } from '@temp-repo/logger'
import type { Context } from '@temp-repo/studio-domain'
import { auth } from '@temp-repo/studio-service'
import { initTRPC, TRPCError } from '@trpc/server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import superjson from 'superjson'

const logger = createLogger('trpc')

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  sse: {
    ping: {
      enabled: true,
      intervalMs: 2_000, // Ping every 2 seconds to keep connection alive
    },
    client: {
      reconnectAfterInactivityMs: 3_000,
    },
  },
  errorFormatter: ({ shape, error }) => {
    // Log all tRPC errors with context
    logger.error(
      {
        code: shape.code,
        path: shape.data?.path,
        httpStatus: shape.data?.httpStatus,
        err: error.message,
        cause: error.cause instanceof Error ? error.cause.message : undefined,
      },
      `tRPC error: ${error.message}`,
    )
    return shape
  },
})

export const router = t.router
export const mergeRouters = t.mergeRouters

//* Context
export const createContext = async ({ req }: FetchCreateContextFnOptions): Promise<Context> => {
  const authResponse = await auth.api.getSession({
    headers: req.headers,
  })

  if (!authResponse?.session && !authResponse?.user) {
    return {
      user: null,
      session: null,
    }
  }

  return {
    user: authResponse.user,
    session: authResponse.session,
  }
}

//* Logging Middleware
const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const startTime = Date.now()

  // Log incoming procedure call
  logger.info({ path, type }, '→ incoming')

  try {
    const result = await next()
    const duration = Date.now() - startTime

    // Log successful procedure completion
    logger.info({ path, type, duration, ok: result.ok }, '← completed')

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    // Log procedure error (detailed error logging handled by errorFormatter)
    logger.error(
      {
        path,
        type,
        duration,
        err: error instanceof Error ? error.message : String(error),
      },
      '✗ failed',
    )

    throw error
  }
})

//* Procedures
const loggedProcedure = t.procedure.use(loggingMiddleware)

export const publicProcedure = loggedProcedure
export const protectedProcedure = loggedProcedure.use(async ({ next, ctx }) => {
  const { user, session } = ctx
  if (!session || !user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { user, session } })
})
