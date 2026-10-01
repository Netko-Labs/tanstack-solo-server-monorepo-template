import { createRouter } from '@tanstack/react-router'
import { NotFound, RouteError, RoutePending } from '@/components/core/root'
import { reportClientError } from '@/integrations/observability'
import { getContext } from '@/integrations/tanstack-query'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const { queryClient } = getContext()

  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: RouteError,
    defaultPendingComponent: RoutePending,
    defaultNotFoundComponent: NotFound,
    // Render and loader errors land in route boundaries, which React reports as caught.
    defaultOnCatch: reportClientError,
    context: { queryClient },
  })
}
