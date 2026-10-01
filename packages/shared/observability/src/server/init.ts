import { logs } from '@opentelemetry/api-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import * as Sentry from '@sentry/node'
import type { OtlpConfig, ServerTelemetryConfig } from '../types'
import { DROPPED_INTEGRATIONS, FLUSH_TIMEOUT_MS } from './constants'
import { AttributeLogProcessor, AttributeSpanProcessor } from './processors'
import { markVendorFrames, otlpUrl } from './utils'

const providers: { tracer?: NodeTracerProvider; logger?: LoggerProvider } = {}

function initSentry(dsn: string, { release, environment }: ServerTelemetryConfig): void {
  Sentry.init({
    dsn,
    release,
    environment,
    sendClientReports: false,
    integrations: (defaults) => defaults.filter(({ name }) => !DROPPED_INTEGRATIONS.has(name)),
    beforeSend: markVendorFrames,
  })
}

// Always the JSON exporters: code-whiskers answers protobuf with 415.
function initOtlp(otlp: OtlpConfig, config: ServerTelemetryConfig): void {
  const resource = resourceFromAttributes({
    'service.name': config.serviceName,
    'service.version': config.release,
    'deployment.environment.name': config.environment,
  })
  const attributes = { release: config.release, 'deployment.environment': config.environment }
  const exportTimeoutMillis = FLUSH_TIMEOUT_MS

  providers.tracer = new NodeTracerProvider({
    resource,
    spanProcessors: [
      new AttributeSpanProcessor(attributes),
      new BatchSpanProcessor(
        new OTLPTraceExporter({ url: otlpUrl(otlp.endpoint, 'traces'), headers: otlp.headers }),
        { exportTimeoutMillis },
      ),
    ],
  })
  providers.tracer.register()

  providers.logger = new LoggerProvider({
    resource,
    processors: [
      new AttributeLogProcessor(attributes),
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: otlpUrl(otlp.endpoint, 'logs'),
          headers: otlp.headers,
        }),
        exportTimeoutMillis,
      }),
    ],
  })
  logs.setGlobalLoggerProvider(providers.logger)
}

/** Call once at boot, before anything logs; with neither `dsn` nor `otlp` it does nothing. */
export function initServerTelemetry(config: ServerTelemetryConfig): void {
  if (config.dsn) initSentry(config.dsn, config)
  if (config.otlp) initOtlp(config.otlp, config)
}

/** Sends what is queued, bounded so an unreachable collector cannot stall shutdown. */
export async function shutdownTelemetry(timeoutMs = FLUSH_TIMEOUT_MS): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs)
  })
  const work = Promise.allSettled([
    Sentry.flush(timeoutMs),
    providers.tracer?.shutdown(),
    providers.logger?.shutdown(),
  ])
  await Promise.race([work, deadline])
  clearTimeout(timer)
}
