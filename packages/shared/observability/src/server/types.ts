import type { LogAttributes } from '@opentelemetry/api-logs'

/** One pino JSON line; every other field becomes a log record attribute. */
export interface PinoLine extends LogAttributes {
  level: number
  msg?: string
  time?: number
}
