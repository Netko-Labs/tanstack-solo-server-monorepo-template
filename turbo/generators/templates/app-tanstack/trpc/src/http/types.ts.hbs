import type { AnyRouter, inferRouterContext } from '@trpc/server'
import type { EdgeLogger } from '../types'

export interface HttpContextOptions {
  req: Request
}

export interface TRPCHttpHandlerOptions<TRouter extends AnyRouter> {
  router: TRouter
  endpoint: string
  createContext: (opts: HttpContextOptions) => Promise<inferRouterContext<TRouter>>
  /** Origins allowed to call with the session cookie; requests without an Origin pass. */
  trustedOrigins: readonly string[]
  /** Refusals only; tRPC calls are logged by the procedure middleware. */
  logger?: EdgeLogger
}
