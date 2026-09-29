import { EventEmitter } from 'node:events'
import type { AnyRouter } from '@trpc/server'
import { getWSConnectionHandler, type WSSHandlerOptions } from '@trpc/server/adapters/ws'
import type { MessageLike, PeerLike, TRPCWebSocketHooks, TRPCWebSocketHooksOptions } from './types'

const WEBSOCKET_OPEN = 1
const WEBSOCKET_CLOSED = 3

/** Adapts a crossws peer to the `ws`-shaped client tRPC's WebSocket adapter drives. */
class PeerSocket extends EventEmitter {
  readyState = WEBSOCKET_OPEN

  constructor(private readonly peer: PeerLike) {
    super()
  }

  send(data: string | Uint8Array): void {
    if (this.readyState === WEBSOCKET_OPEN) this.peer.send(data)
  }

  close(code?: number, reason?: string): void {
    this.readyState = WEBSOCKET_CLOSED
    this.peer.close(code, reason)
  }

  terminate(): void {
    this.readyState = WEBSOCKET_CLOSED
    this.peer.terminate()
  }
}

// tRPC's adapter reads `req.url` + `req.headers.host` (connectionParams live in the query).
function toNodeRequest(request: Request) {
  const url = new URL(request.url)
  return { url: `${url.pathname}${url.search}`, headers: Object.fromEntries(request.headers) }
}

/**
 * Builds crossws hooks that run tRPC's official WebSocket protocol handler per peer,
 * so `wsLink` on the client works unchanged (queries, mutations, subscriptions).
 */
export function createTRPCWebSocketHooks<TRouter extends AnyRouter>(
  opts: TRPCWebSocketHooksOptions<TRouter>,
): TRPCWebSocketHooks {
  const sockets = new Map<string, PeerSocket>()
  const requestOf = new WeakMap<object, Request>()

  const onConnection = getWSConnectionHandler({
    router: opts.router,
    createContext: ({ req }) => {
      const request = requestOf.get(req)
      if (!request) throw new Error('trpc-ws: upgrade request missing for peer')
      return opts.createContext({ req: request })
    },
    onError: ({ error, path }) => opts.onError?.({ error, path }),
    // getWSConnectionHandler never touches `wss`; only applyWSSHandler does.
    wss: undefined as unknown as WSSHandlerOptions<TRouter>['wss'],
  } as WSSHandlerOptions<TRouter>)

  return {
    open(peer) {
      const socket = new PeerSocket(peer)
      sockets.set(peer.id, socket)
      const req = toNodeRequest(peer.request)
      requestOf.set(req, peer.request)
      onConnection(socket as never, req as never)
    },
    message(peer, message: MessageLike) {
      sockets.get(peer.id)?.emit('message', Buffer.from(message.text()), false)
    },
    close(peer) {
      const socket = sockets.get(peer.id)
      if (!socket) return
      socket.readyState = WEBSOCKET_CLOSED
      socket.emit('close')
      sockets.delete(peer.id)
    },
    error(peer, error) {
      sockets.get(peer.id)?.emit('error', error)
    },
  }
}
