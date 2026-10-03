import { isTRPCClientError } from '@trpc/client'
import { QUERY_MAX_RETRIES } from './constants'

/** A 4xx is final on the first answer; network failures and 5xx get another go. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= QUERY_MAX_RETRIES) return false
  const status: unknown = isTRPCClientError(error) ? error.data?.httpStatus : undefined
  return typeof status !== 'number' || status >= 500
}
