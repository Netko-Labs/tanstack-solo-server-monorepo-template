import { isTRPCClientError } from '@trpc/client'
import type { ErrorCopy } from './types'
import { GENERIC_ERROR_COPY, TRPC_ERROR_COPY } from './values'

/**
 * A failed call in words: the feature's copy for a service error code (sent as the message),
 * then copy for the tRPC code, then the generic line. Raw server text never reaches the user.
 */
export function toUserMessage(error: unknown, featureCopy: ErrorCopy = {}): string | null {
  if (!error) return null
  if (!isTRPCClientError(error)) return GENERIC_ERROR_COPY
  const code: unknown = error.data?.code
  const codeCopy = typeof code === 'string' ? TRPC_ERROR_COPY[code] : undefined
  return featureCopy[error.message] ?? codeCopy ?? GENERIC_ERROR_COPY
}
