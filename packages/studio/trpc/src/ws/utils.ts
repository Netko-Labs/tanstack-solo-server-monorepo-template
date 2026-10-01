import { EventEmitter } from 'node:events'
import type { AnyRouter } from '@trpc/server'
import { getWSConnectionHandler, type WSSHandlerOptions } from '@trpc/server/adapters/ws'
import { isTrustedOrigin } from '../shared/origin'
import type {
  CloseDetails,
  MessageLike,
  PeerLike,
  TRPCWebSocketHooks,
  TRPCWebSocketHooksOptions,
  WireRequestFrame,
  WireResponseFrame,
} from './types'

const WEBSOCKET_OPEN = 1
const WEBSOCKET_CLOSED = 3
const POLICY_VIOLATION = 1008
const MESSAGE_TOO_BIG = 1009
export const MAX_WS_MESSAGE_BYTES = 1024 * 1024
/** Live subscriptions one socket may hold; a slot frees on client stop or server `stopped`/error. */
export const MAX_SUBSCRIPTIONS_PER_PEER = 16

/** Adapts a crossws peer to the `ws`-shaped client tRPC's WebSocket adapter drives. */
class PeerSocket extends EventEmitter {
  readyState = WEBSOCKET_OPEN
  readonly openedAt = Date.now()
  /** In-flight request id → method, so a response can be matched to what it answers. */
  readonly requests = new Map<string, string>()
  liveSubscriptions = 0

  constructor(readonly peer: PeerLike) {
    super()
  }

  send(data: string | Uint8Array): void {
    if (this.readyState !== WEBSOCKET_OPEN) return
    if (this.requests.size > 0 && typeof data === 'string') releaseFinished(this, data)
    this.peer.send(data)
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

const openSockets = new Set<PeerSocket>()

/** Closes every live socket, e.g. on SIGTERM, so subscriptions end and presence leaves run. */
export function closeAllPeers(code = 1001, reason = 'server shutting down'): void {
  for (const socket of openSockets) socket.close(code, reason)
}

// tRPC's adapter reads `req.url` + `req.headers.host` (connectionParams live in the query).
function toNodeRequest(request: Request) {
  const url = new URL(request.url)
  return { url: `${url.pathname}${url.search}`, headers: Object.fromEntries(request.headers) }
}

function userIdOf(ctx: unknown): string | undefined {
  if (typeof ctx !== 'object' || ctx === null || !('user' in ctx)) return undefined
  const { user } = ctx
  if (typeof user !== 'object' || user === null || !('id' in user)) return undefined
  return typeof user.id === 'string' ? user.id : undefined
}

function parseFrame(text: string): unknown[] | undefined {
  try {
    const parsed: unknown = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return undefined
  }
}

function release(socket: PeerSocket, key: string): void {
  if (socket.requests.get(key) === 'subscription') socket.liveSubscriptions -= 1
  socket.requests.delete(key)
}

/**
 * The server's last word on an id frees it; matching the recorded method keeps a query's error
 * from freeing a subscription that reused its id.
 */
function releaseFinished(socket: PeerSocket, text: string): void {
  for (const item of parseFrame(text) ?? []) {
    if (typeof item !== 'object' || item === null) continue
    const { id, result, error } = item as WireResponseFrame
    const key = String(id)
    const method = socket.requests.get(key)
    if (!method) continue
    const terminal =
      method === 'subscription' ? result?.type === 'stopped' : result?.type === 'data'
    if (error !== undefined || terminal) release(socket, key)
  }
}

/**
 * False when the frame must be refused: past the subscription cap, or reusing an in-flight id
 * (tRPC's error for it would be mistaken for the original request's).
 */
function trackSubscriptions(socket: PeerSocket, text: string): boolean {
  const items = parseFrame(text)
  if (!items) return true
  for (const item of items) {
    if (typeof item !== 'object' || item === null) continue
    const { id, method } = item as WireRequestFrame
    if (typeof method !== 'string') continue
    const key = String(id)
    if (method === 'subscription.stop') {
      if (socket.requests.get(key) === 'subscription') release(socket, key)
      continue
    }
    if (socket.requests.has(key)) return false
    socket.requests.set(key, method)
    if (method === 'subscription') socket.liveSubscriptions += 1
  }
  return socket.liveSubscriptions <= MAX_SUBSCRIPTIONS_PER_PEER
}

/**
 * Builds crossws hooks that run tRPC's official WebSocket protocol handler per peer,
 * so `wsLink` on the client works unchanged (queries, mutations, subscriptions).
 */
export function createTRPCWebSocketHooks<TRouter extends AnyRouter>(
  opts: TRPCWebSocketHooksOptions<TRouter>,
): TRPCWebSocketHooks {
  const sockets = new Map<string, PeerSocket>()
  const peerOf = new WeakMap<object, PeerLike>()

  const onConnection = getWSConnectionHandler({
    router: opts.router,
    createContext: async ({ req }) => {
      const peer = peerOf.get(req)
      if (!peer) throw new Error('trpc-ws: upgrade request missing for peer')
      const ctx = await opts.createContext({ req: peer.request })
      opts.logger?.info({ peer: peer.id, user: userIdOf(ctx) }, 'socket open')
      return ctx
    },
    onError: ({ error, path, type, ctx, input }) =>
      opts.onError?.({ error, path, type, ctx, input }),
    // Protocol-level: the adapter sends a "PING" message and resets on any message back
    // (wsLink answers "PONG"); no WebSocket ping frames are involved.
    keepAlive: opts.keepAlive ? { enabled: true, ...opts.keepAlive } : undefined,
    // getWSConnectionHandler never touches `wss`; only applyWSSHandler does.
    wss: undefined as unknown as WSSHandlerOptions<TRouter>['wss'],
  } as WSSHandlerOptions<TRouter>)

  return {
    // Browsers attach cookies to cross-site upgrades and never apply CORS to sockets, so
    // this allow-list is what stands between a hostile tab and the session. Non-browser
    // clients send no Origin and carry no ambient cookie, so they pass.
    upgrade(request) {
      const origin = request.headers.get('origin')
      if (!origin || isTrustedOrigin(origin, opts.trustedOrigins)) return undefined
      opts.logger?.warn({ origin }, 'socket origin refused')
      return new Response('forbidden origin', { status: 403 })
    },
    open(peer) {
      const socket = new PeerSocket(peer)
      sockets.set(peer.id, socket)
      openSockets.add(socket)
      const req = toNodeRequest(peer.request)
      peerOf.set(req, peer)
      onConnection(socket as never, req as never)
    },
    message(peer, message: MessageLike) {
      const socket = sockets.get(peer.id)
      if (!socket) return
      const text = message.text()
      if (Buffer.byteLength(text) > MAX_WS_MESSAGE_BYTES) {
        socket.close(MESSAGE_TOO_BIG, 'message too big')
        return
      }
      if (!trackSubscriptions(socket, text)) {
        socket.close(POLICY_VIOLATION, 'too many subscriptions')
        return
      }
      socket.emit('message', Buffer.from(text), false)
    },
    close(peer, details: CloseDetails = {}) {
      const socket = sockets.get(peer.id)
      if (!socket) return
      opts.logger?.info(
        {
          peer: peer.id,
          code: details.code,
          reason: details.reason || undefined,
          lifetime: Date.now() - socket.openedAt,
        },
        'socket closed',
      )
      socket.readyState = WEBSOCKET_CLOSED
      socket.emit('close')
      sockets.delete(peer.id)
      openSockets.delete(socket)
    },
    error(peer, error) {
      sockets.get(peer.id)?.emit('error', error)
    },
  }
}
