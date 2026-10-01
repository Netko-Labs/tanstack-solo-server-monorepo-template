import { isTRPCClientError } from '@trpc/client'
import type { ErrorCopy } from './types'
import { GENERIC_ERROR_COPY, TRPC_ERROR_COPY } from './values'

// The message carries a service error code, never user-facing text; it is only a lookup key.
export function toUserMessage(error: unknown, featureCopy: ErrorCopy = {}): string | null {
  if (!error) return null
  if (!isTRPCClientError(error)) return GENERIC_ERROR_COPY
  const code: unknown = error.data?.code
  const codeCopy = typeof code === 'string' ? TRPC_ERROR_COPY[code] : undefined
  return featureCopy[error.message] ?? codeCopy ?? GENERIC_ERROR_COPY
}
