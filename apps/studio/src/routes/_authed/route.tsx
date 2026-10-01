import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getSession } from '@/integrations/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    return { session }
  },
  loader: ({ context }) => ({ session: context.session }),
  component: Outlet,
})
