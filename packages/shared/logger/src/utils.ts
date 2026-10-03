import { isSpanContextValid, trace } from '@opentelemetry/api'
import type { RootCause, TraceIds } from './types'

/** The innermost `cause`: wrappers like drizzle's embed SQL params in their own message. */
export function rootCause(error: unknown): RootCause {
  let current = error
  while (current instanceof Error && current.cause instanceof Error) current = current.cause
  if (!(current instanceof Error)) return { message: String(current) }
  const code = 'code' in current && current.code !== undefined ? String(current.code) : undefined
  return { message: current.message, code }
}

/** Empty unless an OTel provider is registered and a span is active, so stdout stays unchanged. */
export function activeTraceIds(): TraceIds {
  const span = trace.getActiveSpan()?.spanContext()
  return span && isSpanContextValid(span) ? { trace_id: span.traceId, span_id: span.spanId } : {}
}
