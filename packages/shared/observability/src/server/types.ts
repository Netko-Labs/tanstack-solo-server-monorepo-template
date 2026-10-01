import type { LogAttributes } from '@opentelemetry/api-logs'
import type { LoggerProvider } from '@opentelemetry/sdk-logs'
import type { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'

/** One pino JSON line; every other field becomes a log record attribute. */
export interface PinoLine extends LogAttributes {
  level: number
  msg?: string
  time?: number
}

export interface TelemetryProviders {
  tracer?: NodeTracerProvider
  logger?: LoggerProvider
}
