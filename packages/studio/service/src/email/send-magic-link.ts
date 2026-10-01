import { renderMagicLinkEmail } from './magic-link-email'
import { sendEmail } from './send-email'
import type { MagicLinkEmailInput } from './types'

export async function sendMagicLinkEmail({ email, url }: MagicLinkEmailInput): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Your Studio sign-in link',
    html: renderMagicLinkEmail(url),
    text: `Sign in to Studio: ${url}\nThe link expires in 10 minutes and works once.`,
  })
}
