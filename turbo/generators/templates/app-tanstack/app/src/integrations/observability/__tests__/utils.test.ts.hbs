import { describe, expect, test } from 'bun:test'
import { TRPCClientError } from '@trpc/client'
import { isReportableQueryError } from '../utils'

describe('isReportableQueryError', () => {
  test('errors the server answered are left to the server', () => {
    const answered = TRPCClientError.from({
      error: {
        message: 'x',
        code: -32603,
        data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
      },
    })
    expect(isReportableQueryError(answered)).toBe(false)
  })

  test('failures that never reached the server are reported', () => {
    expect(isReportableQueryError(TRPCClientError.from(new TypeError('fetch failed')))).toBe(true)
    expect(isReportableQueryError(new Error('render bug'))).toBe(true)
  })
})
