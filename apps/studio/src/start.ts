import { createMiddleware, createStart } from '@tanstack/react-start'
import { logger } from '@temp-repo/logger'

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

    logger.info({ method, path, status, duration }, '← completed')

    return nextResponse
  } catch (error) {
    const duration = Date.now() - startTime

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

export const startInstance = createStart(() => ({
  requestMiddleware: [requestLoggerMiddleware],
}))
