import { TRPCClientError } from '@trpc/client'

export const answered = (httpStatus: number) =>
  TRPCClientError.from({ error: { message: 'x', code: -32000, data: { httpStatus } } })
