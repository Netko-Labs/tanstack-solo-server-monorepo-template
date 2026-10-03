import { createLogger } from '@temp-repo/logger'
import {
  createResendClient,
  ResendApiError,
  type ResendClient,
  type ResendClientConfig,
} from '@temp-repo/resend-client'
import type { EmailEnvelope } from '../types'

const logger = createLogger('email')

let client: ResendClient | undefined
let clientConfig: ResendClientConfig | undefined

const resendClient = (config: ResendClientConfig): ResendClient => {
  if (!client || clientConfig !== config) {
    client = createResendClient(config)
    clientConfig = config
  }
  return client
}

export async function sendResendEmail(
  envelope: EmailEnvelope,
  config: ResendClientConfig,
): Promise<void> {
  try {
    await resendClient(config).sendEmail(envelope)
  } catch (error) {
    if (!(error instanceof ResendApiError)) throw error
    // Resend's detail can echo the recipient; only the status leaves this function.
    logger.error({ status: error.status }, 'resend send failed')
    throw new Error(`email delivery failed (${error.status})`)
  }
}
