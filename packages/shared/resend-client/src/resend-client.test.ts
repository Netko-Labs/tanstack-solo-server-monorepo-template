import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { ResendApiError } from './errors'
import { createResendClient } from './resend-client'
import { RESEND_EMAILS_URL } from './values'

const email = { from: 'Studio <a@example.test>', to: 'b@example.test', subject: 'Hi', html: '<p/>' }

describe('createResendClient', () => {
  afterEach(() => {
    mock.restore()
  })

  test('posts the email as JSON with bearer auth and a timeout, returning the id', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ id: 'email-1' }))

    const result = await createResendClient({ apiKey: 'test-key' }).sendEmail(email)

    const [url, init] = fetchSpy.mock.calls[0] ?? []
    expect(String(url)).toBe(RESEND_EMAILS_URL)
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer test-key')
    expect(JSON.parse(String(init?.body))).toEqual(email)
    expect(init?.signal).toBeInstanceOf(AbortSignal)
    expect(result).toEqual({ id: 'email-1' })
  })

  test('a non-2xx response throws ResendApiError with status and detail', async () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(new Response('invalid from', { status: 422 }))

    const error = await createResendClient({ apiKey: 'test-key' })
      .sendEmail(email)
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ResendApiError)
    expect(error).toMatchObject({ status: 422, detail: 'invalid from' })
  })

  test('a 2xx response without an id throws ResendApiError', async () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ message: 'ok' }))

    const error = await createResendClient({ apiKey: 'test-key' })
      .sendEmail(email)
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ResendApiError)
    expect(error).toMatchObject({ status: 200, detail: 'malformed response body' })
  })
})
