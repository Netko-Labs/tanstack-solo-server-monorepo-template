import type { AppRouter as RealtimeRouter } from '@temp-repo/realtime-trpc'
import { createTRPCClient, createWSClient, wsLink } from '@trpc/client'
import superjson from 'superjson'

function getRealtimeWsUrl(): string {
  return import.meta.env.VITE_REALTIME_URL ?? 'ws://localhost:3001/trpc-ws'
}

/** Fetch a fresh JWT for the current session (studio mints it via the jwt plugin). */
export async function getRealtimeToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/token', { credentials: 'include' })
    if (!res.ok) return null
    const { token } = (await res.json()) as { token?: string }
    return token ?? null
  } catch {
    return null
  }
}

/**
 * Realtime tRPC client (WebSocket) for the standalone realtime server. Auth rides
 * `connectionParams.token` (a studio-minted JWT verified via JWKS). One lazy WS
 * connection for the whole app (queries, mutations, subscriptions).
 */
const wsClient = createWSClient({
  url: getRealtimeWsUrl(),
  lazy: { enabled: true, closeMs: 30_000 },
  connectionParams: async () => {
    const token = await getRealtimeToken()
    return token ? { token } : {}
  },
})

export const realtime = createTRPCClient<RealtimeRouter>({
  links: [wsLink({ client: wsClient, transformer: superjson })],
})
