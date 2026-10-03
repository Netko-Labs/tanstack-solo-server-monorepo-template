import { addLogStream, createLogger } from '@temp-repo/logger'
import { createOtlpLogStream, initServerTelemetry } from '@temp-repo/observability/server'
import { studioEnvConfig } from '@temp-repo/studio-config'
import { definePlugin } from 'nitro'

/**
 * Listed first in vite.config.ts, so it runs before anything logs. It registers no `close` hook:
 * hooks run in registration order, so the flush lives at the end of shutdown.ts's, after the drain.
 */
export default definePlugin(() => {
  const { app, observability } = studioEnvConfig
  initServerTelemetry(observability)
  if (observability.otlp) addLogStream(createOtlpLogStream(), 'info')
  if (!app.dev && !observability.dsn && !observability.otlp) {
    createLogger('observability').warn(
      'telemetry is off: set SENTRY_DSN and OTEL_EXPORTER_OTLP_ENDPOINT to report to code-whiskers',
    )
  }
})
