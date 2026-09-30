import { createMiddleware, createStart } from '@tanstack/react-start'
import { logger } from '@temp-repo/logger'

/**
 * ✧･ﾟ: *✧･ﾟ:* REQUEST LOGGER MIDDLEWARE *:･ﾟ✧*:･ﾟ✧
 *
 * Logs all incoming requests and outgoing responses with kawaii energy!
 * Because even server logs deserve to be cute (◕‿◕✿)
 *
 * Note: tRPC routes (/api/trpc) are excluded as they have their own logging middleware
 */
const requestLoggerMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url)
  const path = url.pathname

  // tRPC has its own logging; health probes would log two lines every few seconds.
  if (path.startsWith('/api/trpc') || path === '/api/health') {
    return next()
  }

  const startTime = Date.now()
  const { method } = request

  // Query values can be credentials (magic-link tokens, OAuth codes): log the keys only.
  const queryKeys = [...url.searchParams.keys()]
  logger.info({ method, path, queryKeys: queryKeys.length ? queryKeys : undefined }, '→ incoming')

  try {
    const nextResponse = await next()
    const duration = Date.now() - startTime
    const status = nextResponse.response.status

    // Log successful response ヨシ!
    logger.info({ method, path, status, duration }, '← completed')

    return nextResponse
  } catch (error) {
    const duration = Date.now() - startTime

    // Log error with appropriate drama ダメ!
    logger.error(
      {
        method,
        path,
        duration,
        err: error instanceof Error ? error.message : String(error),
      },
      '✗ failed',
    )

    throw error
  }
})

/**
 * TanStack Start instance with global middleware
 * All requests flow through our kawaii logger! ψ(｀∇´)ψ
 */
export const startInstance = createStart(() => ({
  requestMiddleware: [requestLoggerMiddleware],
}))
