export const SIGN_IN_FORM_TITLE = 'Authentication'
export const SIGN_IN_FORM_BADGE = 'Guest'
export const SIGN_IN_FORM_DESCRIPTION =
  'Sign in with a magic link to access protected features like sending chat messages'
export const SIGN_IN_EMAIL_LABEL = 'Email'
export const SIGN_IN_EMAIL_PLACEHOLDER = 'you@example.com'
export const SIGN_IN_SEND_LINK = 'Send Magic Link'
export const SIGN_IN_SENDING = 'Sending...'
export const SIGN_IN_DEV_HINT =
  'In development, the magic link URL is logged to the server console.'

export const SIGN_IN_LINK_SENT =
  'Magic link sent. Check your inbox, or the server console in development.'
export const SIGN_IN_INVALID_EMAIL = 'Enter a valid email address.'
export const SIGN_IN_ERROR = 'Could not send the magic link. Try again.'
export const SIGN_IN_RATE_LIMITED = 'Too many attempts. Wait a minute and try again.'
export const SIGN_IN_LINK_ERROR = 'That sign-in link did not work. Send yourself a new one.'

export const SIGN_IN_ERROR_COPY: Record<string, string> = {
  VALIDATION_ERROR: SIGN_IN_INVALID_EMAIL,
}

/** The `?error=` better-auth appends when a magic link fails to verify. */
export const SIGN_IN_LINK_ERROR_COPY: Record<string, string> = {
  INVALID_TOKEN: 'That sign-in link expired or was already used. Send yourself a new one.',
}
