import { createFileRoute } from '@tanstack/react-router'
import { handleSentryTunnel } from '@temp-repo/observability/server'
import { studioEnvConfig } from '@temp-repo/studio-config'

export const Route = createFileRoute('/api/monitor')({
  server: {
    handlers: {
      POST: ({ request }) =>
        handleSentryTunnel(request, { allowedDsns: studioEnvConfig.observability.tunnelDsns }),
    },
  },
})
