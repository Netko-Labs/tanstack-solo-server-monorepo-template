import { SpanStatusCode, trace } from '@opentelemetry/api'
import type { SpanAttributes, SpanHandle } from '../types'
import { INSTRUMENTATION_NAME } from './constants'

/**
 * Runs `fn` inside an active span; a throw marks it failed. Exceptions are not recorded on the
 * span: their messages can carry query values.
 */
export function withSpan<T>(
  name: string,
  attributes: SpanAttributes,
  fn: (span: SpanHandle) => Promise<T>,
): Promise<T> {
  return trace
    .getTracer(INSTRUMENTATION_NAME)
    .startActiveSpan(name, { attributes }, async (span) => {
      const handle: SpanHandle = {
        setAttribute: (key, value) => {
          span.setAttribute(key, value)
        },
        fail: () => {
          span.setStatus({ code: SpanStatusCode.ERROR })
        },
      }
      try {
        return await fn(handle)
      } catch (error) {
        handle.fail()
        throw error
      } finally {
        span.end()
      }
    })
}
