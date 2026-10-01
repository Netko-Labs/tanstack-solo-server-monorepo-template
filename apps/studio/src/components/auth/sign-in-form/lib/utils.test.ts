import { describe, expect, test } from 'bun:test'
import { initialSignInForm, signInErrorCallbackUrl, signInErrorMessage } from './utils'
import {
  SIGN_IN_ERROR,
  SIGN_IN_INVALID_EMAIL,
  SIGN_IN_LINK_ERROR,
  SIGN_IN_LINK_ERROR_COPY,
  SIGN_IN_RATE_LIMITED,
} from './values'

describe('sign-in form copy', () => {
  test('maps better-auth codes, then the rate limit, then the generic line', () => {
    expect(signInErrorMessage({ code: 'VALIDATION_ERROR', status: 400 })).toBe(
      SIGN_IN_INVALID_EMAIL,
    )
    expect(signInErrorMessage({ status: 429 })).toBe(SIGN_IN_RATE_LIMITED)
    expect(signInErrorMessage({ code: 'SOMETHING_NEW', status: 500 })).toBe(SIGN_IN_ERROR)
  })

  test('a failed link opens the form with copy, never the raw code', () => {
    expect(initialSignInForm('INVALID_TOKEN').message?.text).toBe(
      SIGN_IN_LINK_ERROR_COPY.INVALID_TOKEN,
    )
    expect(initialSignInForm('failed_to_create_user').message?.text).toBe(SIGN_IN_LINK_ERROR)
    expect(initialSignInForm(undefined).message).toBeNull()
  })

  test('the error callback keeps the redirect', () => {
    expect(signInErrorCallbackUrl('/todos?x=1')).toBe('/sign-in?redirect=%2Ftodos%3Fx%3D1')
    expect(signInErrorCallbackUrl(undefined)).toBe('/sign-in')
  })
})
