import { HeadContent, Scripts } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import * as TanstackQuery from '@/integrations/tanstack-query/root-provider'
import type { RootDocumentProps } from './lib'

// Dead-code eliminated in production builds: the devtools' Solid runtime throws when
// imported in the server bundle, so the import must vanish, not just the render.
const RootDevtools = import.meta.env.DEV
  ? lazy(() => import('./root-devtools').then((m) => ({ default: m.RootDevtools })))
  : null

export function RootDocument({ children }: RootDocumentProps) {
  const rqContext = TanstackQuery.getContext()

  return (
    <TanstackQuery.Provider {...rqContext}>
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body>
          {children}
          {RootDevtools && (
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
