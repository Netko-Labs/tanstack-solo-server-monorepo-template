import { isNotFound, isRedirect } from '@tanstack/react-router'
import { createMiddleware, createStart } from '@tanstack/react-start'
import { logger, rootCause } from '@temp-repo/logger'
import { reportError, withSpan } from '@temp-repo/observability/server'
import { MONITOR_PATH } from '@/integrations/observability'

// Probes and the browser tunnel would flood logs and traces with their own traffic.
const UNOBSERVED_PATHS = new Set(['/api/health', MONITOR_PATH])

const isControlFlow = (error: unknown) => isRedirect(error) || isNotFound(error)

// Server routes and throws that escape SSR. SSR loader and render errors become match state and
// are reported by the browser's route boundary; server-function throws by the function middleware.
const requestMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url)
  const path = url.pathname
  if (UNOBSERVED_PATHS.has(path)) return next()

  const { method } = request
  // tRPC logs each procedure itself.
  const isLogged = !path.startsWith('/api/trpc')
  const startTime = Date.now()

  return withSpan(
    `${method} ${path}`,
    { 'http.request.method': method, 'url.path': path },
    async (span) => {
      if (isLogged) {
        // Query values can be credentials (magic-link tokens, OAuth codes): log the keys only.
        const queryKeys = [...url.searchParams.keys()]
        logger.info(
          { method, path, queryKeys: queryKeys.length ? queryKeys : undefined },
          '→ incoming',
        )
      }
      try {
        const result = await next()
        const status = result.response.status
        span.setAttribute('http.response.status_code', status)
        if (status >= 500) span.fail()
        if (isLogged) {
          logger.info({ method, path, status, duration: Date.now() - startTime }, '← completed')
        }
        return result
      } catch (error) {
        if (!isControlFlow(error)) reportError(error, { tags: { method, path } })
        const { message, code } = rootCause(error)
        logger.error(
          { method, path, duration: Date.now() - startTime, err: message, errCode: code },
          '✗ failed',
        )
        throw error
      }
    },
  )
})

const serverFnErrorMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  try {
    return await next()
  } catch (error) {
    if (!isControlFlow(error)) reportError(error, { tags: { transport: 'server-fn' } })
    throw error
  }
})

export const startInstance = createStart(() => ({
  requestMiddleware: [requestMiddleware],
  functionMiddleware: [serverFnErrorMiddleware],
}))
