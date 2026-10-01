import { createLogger, rootCause } from '@temp-repo/logger'
import { ServiceError } from '@temp-repo/studio-service'
import type { TRPCDefaultErrorShape } from '@trpc/server'
import type { ErrorShapeInput } from './types'

const logger = createLogger('trpc')

/**
 * Outside dev only a service error's code crosses the edge as a message; every other error
 * (SQL text and params included) leaves as its tRPC code, without a stack.
 */
export function formatErrorShape(
  { shape, error }: ErrorShapeInput,
  exposeMessages: boolean,
): TRPCDefaultErrorShape {
  const root = rootCause(error)
  logger[error.code === 'INTERNAL_SERVER_ERROR' ? 'error' : 'debug'](
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
