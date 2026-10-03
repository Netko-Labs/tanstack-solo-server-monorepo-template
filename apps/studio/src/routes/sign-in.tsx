import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignInPage } from '@/components/auth/sign-in-page'
import { pageTitle } from '@/components/core/root'
import { getSession, parseSignInSearch } from '@/integrations/auth'

export const Route = createFileRoute('/sign-in')({
  validateSearch: parseSignInSearch,
  beforeLoad: async ({ search }) => {
    if (await getSession()) throw redirect({ href: search.redirect ?? '/' })
  },
  head: () => ({ meta: [{ title: pageTitle('Sign in') }] }),
  component: SignInPage,
})
