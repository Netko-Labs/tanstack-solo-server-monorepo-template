import { reportError } from '@temp-repo/observability/server'
import { userIdOf } from '../context'
import type { ErrorReporter, ErrorTransport, ReportableFailure } from './types'

/**
 * An adapter `onError` that reports server faults only: every other code is a client mistake
 * or an expected refusal. errorFormatter stays the log line; it also runs for WS parse errors.
 */
export function reportInternalErrors(
  transport: ErrorTransport,
  report: ErrorReporter = reportError,
) {
  return ({ error, path, type, ctx }: ReportableFailure): void => {
    if (error.code !== 'INTERNAL_SERVER_ERROR') return
    report(error, {
      tags: { transport, 'trpc.path': path ?? 'unknown', 'trpc.type': type },
      userId: userIdOf(ctx),
    })
  }
}
