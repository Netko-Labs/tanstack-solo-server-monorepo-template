import type { ResendSendResult } from './types'

export function isSendResult(body: unknown): body is ResendSendResult {
  return typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string'
}
