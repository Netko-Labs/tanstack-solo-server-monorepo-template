import { createLogger } from '@temp-repo/logger'
import { withSpan } from '@temp-repo/observability/server'
import { studioEnvConfig } from '@temp-repo/studio-config'
import type { Context } from '@temp-repo/studio-domain'
import { auth, ServiceError } from '@temp-repo/studio-service'
import { initTRPC, type TRPC_ERROR_CODE_KEY, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { formatErrorShape } from './shared/error-shape'
import type { CreateContextOptions } from './types'

const logger = createLogger('trpc')

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  isDev: studioEnvConfig.app.dev,
  errorFormatter: (opts) => formatErrorShape(opts, studioEnvConfig.app.dev),
})

export const router = t.router
export const mergeRouters = t.mergeRouters

export const createContext = async ({ req }: CreateContextOptions): Promise<Context> => {
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

// UNAUTHORIZED is a signed-out tab polling, not a fault; the root cause of a 5xx is logged by
// the error formatter, so every failure here is a timing line.
const completionLevel = (code: TRPC_ERROR_CODE_KEY) => (code === 'UNAUTHORIZED' ? 'info' : 'warn')

const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const startTime = Date.now()
  logger.debug({ path, type }, '→ incoming')
  const result = await next()
  const duration = Date.now() - startTime
  if (result.ok) {
    logger.info({ path, type, duration, ok: true }, '← completed')
  } else {
    const { code } = result.error
    logger[completionLevel(code)]({ path, type, duration, ok: false, code }, '← completed')
  }
  return result
})

// Outermost, so the logging middleware's lines carry this span's trace id. On a socket the span
// covers setup only: a subscription's stream outlives it.
const spanMiddleware = t.middleware(({ path, type, next }) =>
  withSpan(`trpc.${type} ${path}`, { 'trpc.path': path, 'trpc.type': type }, async (span) => {
    const result = await next()
    if (!result.ok) {
      span.setAttribute('trpc.code', result.error.code)
      if (result.error.code === 'INTERNAL_SERVER_ERROR') span.fail()
    }
    return result
  }),
)

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

const baseProcedure = t.procedure
  .use(spanMiddleware)
  .use(loggingMiddleware)
  .use(serviceErrorMiddleware)

export const publicProcedure = baseProcedure
export const protectedProcedure = baseProcedure.use(async ({ next, ctx }) => {
  const { user, session } = ctx
  // A WebSocket keeps the context it opened with, so expiry must be checked per call.
  if (!session || !user || session.expiresAt.getTime() <= Date.now()) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { user, session } })
})
