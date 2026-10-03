import type { AnyRouter, inferRouterContext, TRPCError, TRPCProcedureType } from '@trpc/server'

/** Shared by the HTTP (fetch) adapter and the WebSocket upgrade request. */
export interface CreateContextOptions {
  req: Request
}

/** The slice of a pino logger the edges write to (structural, so tests can pass a fake). */
export interface EdgeLogger {
  info(fields: object, message: string): void
  warn(fields: object, message: string): void
}

/** A failed call as both edges report it; tRPC raises it once per failure. */
export interface TRPCErrorEvent<TRouter extends AnyRouter> {
  error: TRPCError
  path: string | undefined
  type: TRPCProcedureType | 'unknown'
  ctx: inferRouterContext<TRouter> | undefined
  input: unknown
}
