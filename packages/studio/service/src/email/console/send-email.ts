import { createLogger } from '@temp-repo/logger'
import type { EmailEnvelope } from '../types'

const logger = createLogger('email')

/** No provider configured: print the message so links stay clickable. They are credentials. */
export async function sendConsoleEmail(envelope: EmailEnvelope): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('RESEND_API_KEY is required to send email outside development')
  }
  const { to, subject, text, html } = envelope
  logger.info({ to, subject }, `\n${text ?? html}\n`)
}
