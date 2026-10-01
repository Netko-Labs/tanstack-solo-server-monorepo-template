import { describe, expect, test } from 'bun:test'
import { TRPCClientError } from '@trpc/client'
import { toUserMessage } from '../utils'
import { GENERIC_ERROR_COPY, TRPC_ERROR_COPY } from '../values'

const serverError = (message: string, code: string) =>
  TRPCClientError.from({ error: { message, code: -32000, data: { code } } })

describe('toUserMessage', () => {
  test('the feature copy for a service code wins over the tRPC code', () => {
    const error = serverError('not_found', 'NOT_FOUND')
    expect(toUserMessage(error, { not_found: 'Already gone.' })).toBe('Already gone.')
    expect(toUserMessage(error)).toBe(TRPC_ERROR_COPY.NOT_FOUND ?? '')
  })

  test('raw server text never reaches the user', () => {
    const zodJson = '[\n  {\n    "code": "too_big"\n  }\n]'
    expect(toUserMessage(serverError(zodJson, 'BAD_REQUEST'))).toBe(
      TRPC_ERROR_COPY.BAD_REQUEST ?? '',
    )
    expect(
      toUserMessage(serverError('relation "todo" does not exist', 'INTERNAL_SERVER_ERROR')),
    ).toBe(GENERIC_ERROR_COPY)
    expect(toUserMessage(new Error('fetch failed'))).toBe(GENERIC_ERROR_COPY)
  })

  test('no error, no message', () => {
    expect(toUserMessage(null)).toBeNull()
  })
})
