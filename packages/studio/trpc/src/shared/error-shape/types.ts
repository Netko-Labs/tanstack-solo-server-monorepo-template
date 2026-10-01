import type { TRPCDefaultErrorShape, TRPCError } from '@trpc/server'

export interface ErrorShapeInput {
  shape: TRPCDefaultErrorShape
  error: TRPCError
}
