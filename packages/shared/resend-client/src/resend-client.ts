import { ResendApiError } from './errors'
import type { ResendClient, ResendClientConfig } from './types'
import { isSendResult } from './utils'
import { RESEND_EMAILS_URL, RESEND_TIMEOUT_MS } from './values'

export function createResendClient(config: ResendClientConfig): ResendClient {
  const timeoutMs = config.timeoutMs ?? RESEND_TIMEOUT_MS

  return {
    sendEmail: async (email) => {
      const res = await fetch(RESEND_EMAILS_URL, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${config.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(email),
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!res.ok) throw new ResendApiError(res.status, await res.text())
      const body: unknown = await res.json().catch(() => null)
      if (!isSendResult(body)) throw new ResendApiError(res.status, 'malformed response body')
      return { id: body.id }
    },
  }
}
