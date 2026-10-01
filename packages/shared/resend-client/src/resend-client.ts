import { ResendApiError } from './errors'
import type { ResendClient, ResendClientConfig, ResendSendResult } from './types'
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
      return (await res.json()) as ResendSendResult
    },
  }
}
