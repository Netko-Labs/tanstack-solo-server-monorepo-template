import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import type * as React from 'react'
import superjson from 'superjson'
import { TRPCProvider, trpcClient } from '@/integrations/trpc'

// Singleton QueryClient for SSR
let clientQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new QueryClient
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
        },
        dehydrate: { serializeData: superjson.serialize },
        hydrate: { deserializeData: superjson.deserialize },
      },
    })
  }

  // Browser: use singleton pattern to avoid re-creating between renders
  if (!clientQueryClient) {
    clientQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
        dehydrate: { serializeData: superjson.serialize },
        hydrate: { deserializeData: superjson.deserialize },
      },
    })
  }
  return clientQueryClient
}

export function getContext() {
  const queryClient = getQueryClient()

  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  })
  return {
    queryClient,
    trpc: serverHelpers,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
