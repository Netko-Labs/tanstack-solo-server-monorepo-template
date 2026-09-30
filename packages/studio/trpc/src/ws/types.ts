import type { AnyRouter, inferRouterContext } from '@trpc/server'

/** The slice of a crossws `Peer` the bridge drives (structural, so no crossws dependency here). */
export interface PeerLike {
  id: string
  request: Request
  send(data: string | Uint8Array): unknown
  close(code?: number, reason?: string): void
  terminate(): void
}

export interface MessageLike {
  text(): string
}

export interface WSContextOptions {
  req: Request
}

export interface TRPCWebSocketHooksOptions<TRouter extends AnyRouter> {
  router: TRouter
  createContext: (opts: WSContextOptions) => Promise<inferRouterContext<TRouter>>
  /** Origins allowed to open the socket; browsers send cookies on cross-site upgrades. */
  trustedOrigins: readonly string[]
  keepAlive?: { pingMs: number; pongWaitMs: number }
  onError?: (opts: { error: Error; path?: string }) => void
}

export interface TRPCWebSocketHooks {
  upgrade(request: Request): Response | undefined
  open(peer: PeerLike): void
  message(peer: PeerLike, message: MessageLike): void
  close(peer: PeerLike): void
  error(peer: PeerLike, error: Error): void
}
