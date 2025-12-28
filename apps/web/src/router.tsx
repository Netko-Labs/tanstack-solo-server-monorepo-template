import { createRouter } from '@tanstack/react-router'
import { getContext } from '@/integrations/tanstack-query/root-provider'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const { queryClient, trpc } = getContext()

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: {
      queryClient,
      trpc,
    },
  })

  return router
}
