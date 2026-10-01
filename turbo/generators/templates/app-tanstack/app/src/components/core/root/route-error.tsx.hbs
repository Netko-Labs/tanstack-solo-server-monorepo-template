import { type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router'
import { Button, buttonVariants } from '@temp-repo/ui/components/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@temp-repo/ui/components/empty'
import {
  ROUTE_ERROR_DESCRIPTION,
  ROUTE_ERROR_HOME_LABEL,
  ROUTE_ERROR_RETRY_LABEL,
  ROUTE_ERROR_TITLE,
} from './lib'

/** The router's default error screen; the router's `defaultOnCatch` has already reported it. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const retry = () => {
    reset()
    void router.invalidate()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{ROUTE_ERROR_TITLE}</EmptyTitle>
          <EmptyDescription>{ROUTE_ERROR_DESCRIPTION}</EmptyDescription>
        </EmptyHeader>
        {import.meta.env.DEV && (
          <pre className="max-w-full overflow-x-auto text-left text-muted-foreground text-xs">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        )}
        <EmptyContent className="flex-row justify-center">
          <Button onClick={retry}>{ROUTE_ERROR_RETRY_LABEL}</Button>
          <Link to="/" className={buttonVariants({ variant: 'outline' })}>
            {ROUTE_ERROR_HOME_LABEL}
          </Link>
        </EmptyContent>
      </Empty>
    </main>
  )
}
