import type { SignInAuthError, SignInFormState } from './types'
import {
  SIGN_IN_ERROR,
  SIGN_IN_ERROR_COPY,
  SIGN_IN_LINK_ERROR,
  SIGN_IN_LINK_ERROR_COPY,
  SIGN_IN_RATE_LIMITED,
} from './values'

export function signInErrorMessage({ code, status }: SignInAuthError): string {
  const copy =
    code && Object.hasOwn(SIGN_IN_ERROR_COPY, code) ? SIGN_IN_ERROR_COPY[code] : undefined
  return copy ?? (status === 429 ? SIGN_IN_RATE_LIMITED : SIGN_IN_ERROR)
}

/** A failed link lands back on sign-in with `?error=`, keeping where the user was headed. */
export function signInErrorCallbackUrl(redirect: string | undefined): string {
  return redirect ? `/sign-in?redirect=${encodeURIComponent(redirect)}` : '/sign-in'
}

export function initialSignInForm(linkError: string | undefined): SignInFormState {
  const copy =
    linkError && Object.hasOwn(SIGN_IN_LINK_ERROR_COPY, linkError)
      ? SIGN_IN_LINK_ERROR_COPY[linkError]
      : undefined
  const message = linkError ? { type: 'error' as const, text: copy ?? SIGN_IN_LINK_ERROR } : null
  return { email: '', isSending: false, message }
}
