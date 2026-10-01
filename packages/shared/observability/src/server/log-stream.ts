import { context } from '@opentelemetry/api'
import { logs } from '@opentelemetry/api-logs'
import type { LogLineStream } from '../types'
import {
  DEFAULT_SEVERITY,
  DROPPED_LOG_KEYS,
  INSTRUMENTATION_NAME,
  SEVERITY_BY_PINO_LEVEL,
} from './constants'
import type { PinoLine } from './types'

/**
 * A pino destination that re-emits each JSON line as an OTLP log record. Pino writes
 * synchronously, so the caller's span is still active and the record carries its trace id.
 */
export function createOtlpLogStream(): LogLineStream {
  const otel = logs.getLogger(INSTRUMENTATION_NAME)
  return {
    write(line) {
      try {
        const record: PinoLine = JSON.parse(line)
        const [severityNumber, severityText] =
          SEVERITY_BY_PINO_LEVEL[record.level] ?? DEFAULT_SEVERITY
        const attributes = Object.fromEntries(
          Object.entries(record).filter(([key]) => !DROPPED_LOG_KEYS.has(key)),
        )
        otel.emit({
          severityNumber,
          severityText,
          body: record.msg,
          timestamp: record.time,
          attributes,
          context: context.active(),
        })
      } catch {
        // A telemetry fault must never break the log call that triggered it.
      }
    },
  }
}
