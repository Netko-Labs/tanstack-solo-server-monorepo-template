import { createFileRoute } from '@tanstack/react-router'
import { appRouter, createContext } from '@temp-repo/studio-trpc'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: appRouter,
    endpoint: '/api/trpc',
    createContext: createContext,
  })
}

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
})
