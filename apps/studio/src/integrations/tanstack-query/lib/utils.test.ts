import { describe, expect, test } from 'bun:test'
import { TRPCClientError } from '@trpc/client'
import { QUERY_MAX_RETRIES } from './constants'
import { shouldRetryQuery } from './utils'

const answered = (httpStatus: number) =>
  TRPCClientError.from({ error: { message: 'x', code: -32000, data: { httpStatus } } })

describe('shouldRetryQuery', () => {
  test('a client error is never retried', () => {
    expect(shouldRetryQuery(0, answered(401))).toBe(false)
    expect(shouldRetryQuery(0, answered(404))).toBe(false)
  })

  test('server and network failures retry up to the cap', () => {
    expect(shouldRetryQuery(0, answered(500))).toBe(true)
    expect(shouldRetryQuery(0, TRPCClientError.from(new TypeError('fetch failed')))).toBe(true)
    expect(shouldRetryQuery(QUERY_MAX_RETRIES, answered(503))).toBe(false)
  })
})
