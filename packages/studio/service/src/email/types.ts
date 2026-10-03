export interface MagicLinkEmailInput {
  email: string
  url: string
}

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailEnvelope extends EmailMessage {
  from: string
}
