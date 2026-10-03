import { createFileRoute } from '@tanstack/react-router'
import { createLogger } from '@temp-repo/logger'
import { studioEnvConfig } from '@temp-repo/studio-config'
import {
  appRouter,
  createContext,
  createTRPCHttpHandler,
  reportInternalErrors,
} from '@temp-repo/studio-trpc'

const handle = createTRPCHttpHandler({
  router: appRouter,
  endpoint: '/api/trpc',
  createContext,
  trustedOrigins: [studioEnvConfig.app.baseUrl, ...studioEnvConfig.auth.trustedOrigins],
  logger: createLogger('trpc-http'),
  onError: reportInternalErrors('http'),
})

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
})
