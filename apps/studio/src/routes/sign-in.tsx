import { createFileRoute, redirect } from '@tanstack/react-router'
import { parseSignInSearch, SignInPage } from '@/components/auth/sign-in-page'
import { getSession } from '@/integrations/auth'

export const Route = createFileRoute('/sign-in')({
  validateSearch: parseSignInSearch,
  beforeLoad: async ({ search }) => {
    if (await getSession()) throw redirect({ href: search.redirect ?? '/' })
  },
  component: SignInPage,
})
