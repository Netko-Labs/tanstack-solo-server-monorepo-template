import { HeadContent, Scripts } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import * as TanstackQuery from '@/integrations/tanstack-query/root-provider'
import { type RootDocumentProps, useIsHydrated } from './lib'

// Dead-code eliminated in production builds: the devtools' Solid runtime throws when
// imported in the server bundle, so the import must vanish, not just the render.
// In dev the lazy import is only resolved after hydration, never during SSR.
const RootDevtools = import.meta.env.DEV
  ? lazy(() => import('./root-devtools').then((m) => ({ default: m.RootDevtools })))
  : null

export function RootDocument({ children }: RootDocumentProps) {
  const rqContext = TanstackQuery.getContext()
  const isHydrated = useIsHydrated()

  return (
    <TanstackQuery.Provider {...rqContext}>
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body>
          {children}
          {RootDevtools && isHydrated && (
            <Suspense>
              <RootDevtools />
            </Suspense>
          )}
          <Scripts />
        </body>
      </html>
    </TanstackQuery.Provider>
  )
}
