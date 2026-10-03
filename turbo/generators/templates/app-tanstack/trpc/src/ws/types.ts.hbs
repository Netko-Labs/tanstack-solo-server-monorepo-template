import type { AnyRouter, inferRouterContext } from '@trpc/server'
import type { EdgeLogger, TRPCErrorEvent } from '../types'

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

/**
 * Origins are checked because browsers send cookies on cross-site upgrades. The logger records
 * socket open/close and origin refusals, never frame contents.
 */
export interface TRPCWebSocketHooksOptions<TRouter extends AnyRouter> {
  router: TRouter
  createContext: (opts: WSContextOptions) => Promise<inferRouterContext<TRouter>>
  trustedOrigins: readonly string[]
  keepAlive?: { pingMs: number; pongWaitMs: number }
  onError?: (event: TRPCErrorEvent<TRouter>) => void
  logger?: EdgeLogger
}

export interface CloseDetails {
  code?: number
  reason?: string
}

export interface TRPCWebSocketHooks {
  upgrade(request: Request): Response | undefined
  open(peer: PeerLike): void
  message(peer: PeerLike, message: MessageLike): void
  close(peer: PeerLike, details?: CloseDetails): void
  error(peer: PeerLike, error: Error): void
}

/** A client frame as the bridge reads it; fields stay `unknown` until checked. */
export interface WireRequestFrame {
  id?: unknown
  method?: unknown
}

/** A server frame as the bridge reads it; fields stay `unknown` until checked. */
export interface WireResponseFrame {
  id?: unknown
  result?: { type?: unknown }
  error?: unknown
}
