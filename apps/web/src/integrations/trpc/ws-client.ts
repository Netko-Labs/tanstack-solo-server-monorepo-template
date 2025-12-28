import type { AppRouter } from '@temp-repo/web-trpc'
import type { TRPCClient } from '@trpc/client'
import { createTRPCClient, createWSClient, loggerLink, wsLink } from '@trpc/client'
import superjson from 'superjson'

/**
 * ✧･ﾟ: *✧･ﾟ:* WEBSOCKET TRPC CLIENT *:･ﾟ✧*:･ﾟ✧
 *
 * tRPC client for WebSocket connections (subscriptions).
 * Client-side only! Provides real-time updates via WebSocket (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
 */

/**
 * Get WebSocket URL from window location (client-side only) ✨
 */
function getWebSocketUrl(): string {
  // Only run on client side (◕‿◕)
  if (typeof window === 'undefined') {
    return 'ws://localhost:3000/api/trpc' // Dummy URL for SSR
  }

  // Use window.location to build WebSocket URL (no server config needed!)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host

  return `${protocol}//${host}/api/trpc`
}

/**
 * Lazy-initialized WebSocket client ヨシ!
 */
let _wsTrpcClient: TRPCClient<AppRouter> | null = null

/**
 * Get or create WebSocket tRPC client (◕‿◕✿)
 * Lazy initialization prevents SSR issues!
 */
function getWsTrpcClient(): TRPCClient<AppRouter> {
  // Return dummy client on server side
  if (typeof window === 'undefined') {
    throw new Error('wsTrpcClient can only be used on the client side!')
  }

  // Create client only once (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
  if (!_wsTrpcClient) {
    const wsClient = createWSClient({
      url: getWebSocketUrl(),
    })

    _wsTrpcClient = createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        wsLink({
          client: wsClient,
          transformer: superjson,
        }),
      ],
    })
  }

  return _wsTrpcClient
}

/**
 * WebSocket tRPC client for subscriptions (◕‿◕✿)
 * Use this client-side only for real-time updates!
 *
 * Proxy that lazy-loads the actual client to prevent SSR issues ✨
 */
export const wsTrpcClient = new Proxy({} as TRPCClient<AppRouter>, {
  get(_target, prop) {
    const client = getWsTrpcClient()
    return client[prop as keyof typeof client]
  },
})
