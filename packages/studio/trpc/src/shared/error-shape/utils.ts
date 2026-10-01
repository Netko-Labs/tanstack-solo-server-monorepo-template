import { createLogger, rootCause } from '@temp-repo/logger'
import { ServiceError } from '@temp-repo/studio-service'
import type { TRPCDefaultErrorShape } from '@trpc/server'
import type { ErrorLogLevel, ErrorShapeInput } from './types'

const logger = createLogger('trpc')

// An error with no resolved procedure (unknown path, parse error, oversized batch) never reaches
// the logging middleware, so it is the formatter's to surface.
export function errorLogLevel({
  error,
  type,
}: Pick<ErrorShapeInput, 'error' | 'type'>): ErrorLogLevel {
  if (error.code === 'INTERNAL_SERVER_ERROR') return 'error'
  return type === 'unknown' ? 'warn' : 'debug'
}

/**
 * Outside dev only a service error's code crosses the edge as a message; every other error
 * (SQL text and params included) leaves as its tRPC code, without a stack.
 */
export function formatErrorShape(
  { shape, error, type }: ErrorShapeInput,
  exposeMessages: boolean,
): TRPCDefaultErrorShape {
  const root = rootCause(error)
  logger[errorLogLevel({ error, type })](
    {
      code: error.code,
      path: shape.data.path,
      httpStatus: shape.data.httpStatus,
      err: root.message,
      errCode: root.code,
    },
    `tRPC ${error.code}`,
  )
  if (exposeMessages || error.cause instanceof ServiceError) return shape
  const { stack: _stack, ...data } = shape.data
  return { ...shape, message: error.code, data }
}
