import type { AnyRouter, inferRouterContext } from '@trpc/server'

export interface HttpContextOptions {
  req: Request
}

export interface TRPCHttpHandlerOptions<TRouter extends AnyRouter> {
  router: TRouter
  endpoint: string
  createContext: (opts: HttpContextOptions) => Promise<inferRouterContext<TRouter>>
  /** Origins allowed to call with the session cookie; requests without an Origin pass. */
  trustedOrigins: readonly string[]
}
