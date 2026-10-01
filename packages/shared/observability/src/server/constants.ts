import { SeverityNumber } from '@opentelemetry/api-logs'

/** Shutdown budget: the hub drains first, and SERVER_SHUTDOWN_TIMEOUT is 10 s in total. */
export const FLUSH_TIMEOUT_MS = 2_000

/** handleTunnelRequest buffers the whole body, so the cap is ours to enforce. */
export const TUNNEL_MAX_BYTES = 1024 * 1024

export const INSTRUMENTATION_NAME = '@temp-repo/observability'

/** code-whiskers keeps only `event` items; session envelopes are discarded on arrival. */
export const DROPPED_INTEGRATIONS: ReadonlySet<string> = new Set(['ProcessSession'])

/** Nitro bundles dependencies into `_libs/`, which code-whiskers would count as app frames. */
export const VENDOR_FRAME_MARKERS = ['/_libs/', '/node_modules/']

/** Pino fields that duplicate the OTLP record's own timestamp and severity. */
export const DROPPED_LOG_KEYS: ReadonlySet<string> = new Set([
  'level',
  'msg',
  'time',
  'pid',
  'hostname',
])

export const SEVERITY_BY_PINO_LEVEL: Readonly<Record<number, readonly [SeverityNumber, string]>> = {
  10: [SeverityNumber.TRACE, 'TRACE'],
  20: [SeverityNumber.DEBUG, 'DEBUG'],
  30: [SeverityNumber.INFO, 'INFO'],
  40: [SeverityNumber.WARN, 'WARN'],
  50: [SeverityNumber.ERROR, 'ERROR'],
  60: [SeverityNumber.FATAL, 'FATAL'],
}

export const DEFAULT_SEVERITY = [SeverityNumber.INFO, 'INFO'] as const
