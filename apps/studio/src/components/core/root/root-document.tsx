import { HeadContent, Scripts, useRouter } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { Provider } from '@/integrations/tanstack-query'
import { type RootDocumentProps, useIsHydrated } from './lib'

// Dead-code eliminated in production builds: the devtools' Solid runtime throws when
// imported in the server bundle, so the import must vanish, not just the render.
// In dev the lazy import is only resolved after hydration, never during SSR.
const RootDevtools = import.meta.env.DEV
  ? lazy(() => import('./root-devtools').then((m) => ({ default: m.RootDevtools })))
  : null

export function RootDocument({ children }: RootDocumentProps) {
  // The router's QueryClient; on the server that is one per request.
  const { queryClient } = useRouter().options.context
  const isHydrated = useIsHydrated()

  return (
    <Provider queryClient={queryClient}>
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
    </Provider>
  )
}
