import { createRootRouteWithContext } from '@tanstack/react-router'
import appCss from '@temp-repo/ui/globals.css?url'
import type { RouterContext } from '@/components/core/root/definitions'
import { NotFound } from '@/components/core/root/not-found'
import { RootDocument } from '@/components/core/root/root-document'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})
