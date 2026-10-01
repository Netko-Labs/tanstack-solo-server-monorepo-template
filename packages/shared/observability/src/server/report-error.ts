import { trace } from '@opentelemetry/api'
import * as Sentry from '@sentry/node'
import type { ErrorScope } from '../types'
import { innermostError } from './utils'

const reported = new WeakSet<object>()

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null

/**
 * Captures once per error object, however many seams see it. The explicit trace context is
 * what links the event to its OTLP logs in code-whiskers.
 */
export function reportError(error: unknown, scope: ErrorScope = {}): void {
  if (!Sentry.getClient()) return
  const cause = innermostError(error)
  if ((isObject(error) && reported.has(error)) || (isObject(cause) && reported.has(cause))) return
  if (isObject(error)) reported.add(error)
  if (isObject(cause)) reported.add(cause)

  const span = trace.getActiveSpan()?.spanContext()
  Sentry.captureException(cause, {
    tags: { ...scope.tags, ...(span && { trace_id: span.traceId }) },
    contexts: span ? { trace: { trace_id: span.traceId, span_id: span.spanId } } : undefined,
    user: scope.userId ? { id: scope.userId } : undefined,
  })
}
