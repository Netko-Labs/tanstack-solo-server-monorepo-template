import { createRouter } from '@tanstack/react-router'
import { NotFound, RouteError, RoutePending } from '@/components/core/root'
import { reportQueryError } from '@/integrations/observability'
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
    // Render and loader errors land in route boundaries, which React reports as caught; an answered
    // tRPC error is the server's to report.
    defaultOnCatch: reportQueryError,
    context: { queryClient },
  })
}
