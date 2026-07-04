import type { AppRouter } from '@temp-repo/studio-trpc'
import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client'
import superjson from 'superjson'

/**
 * Studio tRPC client — auth-only queries over HTTP (`/api/trpc`). All
 * transactional + realtime data goes to the realtime server (see integrations/realtime).
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpBatchLink({ url: '/api/trpc', transformer: superjson }),
  ],
})
