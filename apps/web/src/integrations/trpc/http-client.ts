import type { AppRouter } from '@temp-repo/web-trpc'
import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  loggerLink,
  splitLink,
} from '@trpc/client'
import superjson from 'superjson'

/**
 * ✧･ﾟ: *✧･ﾟ:* HTTP TRPC CLIENT *:･ﾟ✧*:･ﾟ✧
 *
 * tRPC client for HTTP requests with SSE support (◕‿◕✿)
 * - Uses httpBatchLink for queries and mutations (optimal batching)
 * - Uses httpSubscriptionLink for subscriptions (Server-Sent Events)
 */

export const httpTrpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    splitLink({
      // Use SSE for subscriptions
      condition: (op) => op.type === 'subscription',
      true: httpSubscriptionLink({
        url: '/api/trpc',
        transformer: superjson,
      }),
      // Use batch link for queries and mutations
      false: httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
        headers: () => ({
          'Content-Type': 'application/json',
        }),
      }),
    }),
  ],
})
