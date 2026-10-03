import type { ErrorEvent } from '@sentry/node'
import { VENDOR_FRAME_MARKERS } from './constants'

export const otlpUrl = (endpoint: string, signal: 'traces' | 'logs') =>
  `${endpoint.replace(/\/+$/, '')}/v1/${signal}`

/** The innermost `cause`: wrappers like drizzle's embed SQL params in their own message. */
export function innermostError(error: unknown): unknown {
  let current = error
  while (current instanceof Error && current.cause instanceof Error) current = current.cause
  return current
}

export function markVendorFrames(event: ErrorEvent): ErrorEvent {
  for (const value of event.exception?.values ?? []) {
    for (const frame of value.stacktrace?.frames ?? []) {
      const { filename = '' } = frame
      if (VENDOR_FRAME_MARKERS.some((marker) => filename.includes(marker))) frame.in_app = false
    }
  }
  return event
}
