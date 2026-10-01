import { createLogger } from '@temp-repo/logger'
import type { Context } from '@temp-repo/studio-domain'
import { auth, ServiceError } from '@temp-repo/studio-service'
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'

const logger = createLogger('trpc')

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => {
    // Client errors (auth, validation) are expected traffic; only server faults are errors.
    // Drizzle wraps the pg error in a message that embeds the SQL params, so log the root.
    const root = rootCause(error)
    const level = error.code === 'INTERNAL_SERVER_ERROR' ? 'error' : 'debug'
    logger[level](
      {
        code: error.code,
        path: shape.data?.path,
        httpStatus: shape.data?.httpStatus,
        err: root.message,
        errCode: 'code' in root ? String(root.code) : undefined,
      },
      `tRPC ${error.code}`,
    )
    return shape
  },
})

function rootCause(error: Error): Error & { code?: unknown } {
  let current: Error = error
  while (current.cause instanceof Error) current = current.cause
  return current
}

export const router = t.router
export const mergeRouters = t.mergeRouters

//* Context — shared by the HTTP (fetch) adapter and the WebSocket upgrade request
export const createContext = async ({ req }: { req: Request }): Promise<Context> => {
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
  logger.debug({ path, type }, '→ incoming')

  try {
    const result = await next()
    const duration = Date.now() - startTime

    // Log successful procedure completion
    logger.debug({ path, type, duration, ok: result.ok }, '← completed')

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    // Detailed logging happens in errorFormatter; this is the timing line.
    logger.debug({ path, type, duration }, '✗ failed')

    throw error
  }
})

const serviceErrorMiddleware = t.middleware(async ({ next }) => {
  const result = await next()
  if (!result.ok && result.error.cause instanceof ServiceError) {
    const { cause } = result.error
    throw new TRPCError({
      code: cause.code === 'not_found' ? 'NOT_FOUND' : 'PRECONDITION_FAILED',
      message: cause.code,
      cause,
    })
  }
  return result
})

//* Procedures
const baseProcedure = t.procedure.use(loggingMiddleware).use(serviceErrorMiddleware)

export const publicProcedure = baseProcedure
export const protectedProcedure = baseProcedure.use(async ({ next, ctx }) => {
  const { user, session } = ctx
  // A WebSocket keeps the context it opened with, so expiry must be checked per call.
  if (!session || !user || session.expiresAt.getTime() <= Date.now()) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { user, session } })
})
