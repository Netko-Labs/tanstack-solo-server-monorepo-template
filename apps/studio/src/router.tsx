import { createRouter } from '@tanstack/react-router'
import { getContext } from '@/integrations/tanstack-query'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const { queryClient } = getContext()

  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: { queryClient },
  })
}
