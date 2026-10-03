export interface ResendClientConfig {
  apiKey: string
  timeoutMs?: number
}

export interface ResendEmail {
  from: string
  to: string
  subject: string
  html: string
  text?: string
}

export interface ResendSendResult {
  id: string
}

export interface ResendClient {
  sendEmail: (email: ResendEmail) => Promise<ResendSendResult>
}
