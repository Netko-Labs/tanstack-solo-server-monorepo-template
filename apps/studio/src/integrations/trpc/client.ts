import type { AppRouter } from '@temp-repo/studio-trpc'
import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  loggerLink,
  splitLink,
  wsLink,
} from '@trpc/client'
import superjson from 'superjson'
import { getWebSocketUrl, TRPC_HTTP_URL, TRPC_WS_IDLE_CLOSE_MS } from './lib'

const loggerLinkInstance = loggerLink<AppRouter>({
  enabled: (opts) =>
    process.env.NODE_ENV === 'development' ||
    (opts.direction === 'down' && opts.result instanceof Error),
})

/**
 * Queries + mutations batch over HTTP; subscriptions ride one lazy WebSocket to
 * `/trpc-ws`. SSR never subscribes, so the server build stays HTTP-only.
 */
function createLinks() {
  const http = httpBatchLink<AppRouter>({ url: TRPC_HTTP_URL, transformer: superjson })
  if (typeof window === 'undefined') return [loggerLinkInstance, http]

  const wsClient = createWSClient({
    url: getWebSocketUrl,
    lazy: { enabled: true, closeMs: TRPC_WS_IDLE_CLOSE_MS },
  })
  return [
    loggerLinkInstance,
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: wsLink<AppRouter>({ client: wsClient, transformer: superjson }),
      false: http,
    }),
  ]
}

export const trpcClient = createTRPCClient<AppRouter>({ links: createLinks() })
