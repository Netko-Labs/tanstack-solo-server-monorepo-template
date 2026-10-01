import type { AnyRouter, inferRouterContext } from '@trpc/server'
import type { EdgeLogger } from '../types'

export interface HttpContextOptions {
  req: Request
}

/**
 * Requests without an Origin pass the origin check. The logger records refusals only; tRPC
 * calls are logged by the procedure middleware.
 */
export interface TRPCHttpHandlerOptions<TRouter extends AnyRouter> {
  router: TRouter
  endpoint: string
  createContext: (opts: HttpContextOptions) => Promise<inferRouterContext<TRouter>>
  trustedOrigins: readonly string[]
  logger?: EdgeLogger
}
