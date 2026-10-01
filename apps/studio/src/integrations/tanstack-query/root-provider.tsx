import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TRPCProvider, trpcClient } from '@/integrations/trpc'
import { QUERY_STALE_TIME_MS, type QueryProviderProps } from './lib'

let clientQueryClient: QueryClient | undefined

function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
      },
    },
  })
}

/** One client per browser; on the server a fresh one per router (per request). */
function getQueryClient() {
  if (typeof window === 'undefined') {
    return createAppQueryClient()
  }

  if (!clientQueryClient) {
    clientQueryClient = createAppQueryClient()
  }
  return clientQueryClient
}

/** Called once by `getRouter`; the shell must reuse the router's context, not call this again. */
export function getContext() {
  return { queryClient: getQueryClient() }
}

export function Provider({ children, queryClient }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
