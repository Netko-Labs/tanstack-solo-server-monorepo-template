import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { reportQueryError } from '@/integrations/observability'
import { TRPCProvider, trpcClient } from '@/integrations/trpc'
import { QUERY_STALE_TIME_MS, type QueryProviderProps, shouldRetryQuery } from './lib'

let clientQueryClient: QueryClient | undefined

function createAppQueryClient() {
  // Errors surface where they are rendered; the caches only report them, never toast.
  return new QueryClient({
    queryCache: new QueryCache({ onError: reportQueryError }),
    mutationCache: new MutationCache({ onError: reportQueryError }),
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        retry: shouldRetryQuery,
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
