import type { AppRouter } from '@temp-repo/studio-trpc'
import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  loggerLink,
  splitLink,
  type TRPCWebSocketClient,
  wsLink,
} from '@trpc/client'
import superjson from 'superjson'
import { getWebSocketUrl, TRPC_HTTP_URL, TRPC_WS_IDLE_CLOSE_MS } from './lib'

const loggerLinkInstance = loggerLink<AppRouter>({
  enabled: (opts) =>
    process.env.NODE_ENV === 'development' ||
    (opts.direction === 'down' && opts.result instanceof Error),
})

// A socket keeps the session it opened with; it is closed whenever the user changes so
// the next subscription authenticates as the current one.
const wsClient: TRPCWebSocketClient | undefined =
  typeof window === 'undefined'
    ? undefined
    : createWSClient({
        url: getWebSocketUrl,
        lazy: { enabled: true, closeMs: TRPC_WS_IDLE_CLOSE_MS },
      })

export function closeRealtimeSocket(): void {
  wsClient?.close()
}

/**
 * Queries + mutations batch over HTTP; subscriptions ride one lazy WebSocket to
 * `/trpc-ws`. SSR never subscribes, so the server build stays HTTP-only.
 */
function createLinks() {
  const http = httpBatchLink<AppRouter>({ url: TRPC_HTTP_URL, transformer: superjson })
  if (!wsClient) return [loggerLinkInstance, http]
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
