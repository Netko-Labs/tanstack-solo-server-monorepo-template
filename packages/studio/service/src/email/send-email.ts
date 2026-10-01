import { studioEnvConfig } from '@temp-repo/studio-config'
import { sendConsoleEmail } from './console'
import { sendResendEmail } from './resend'
import type { EmailMessage } from './types'

export async function sendEmail(message: EmailMessage): Promise<void> {
  const { from, resend } = studioEnvConfig.email
  const envelope = { ...message, from }
  if (!resend) return sendConsoleEmail(envelope)
  return sendResendEmail(envelope, resend)
}
