import { Skeleton } from '@temp-repo/ui/components/skeleton'
import { SignInForm } from '@/components/auth/sign-in-form'
import { AuthLoggedIn } from './auth-logged-in'
import { useAuthSection } from './lib'

export function AuthSection() {
  const { user, isPending, isSigningOut, handleSignOut } = useAuthSection()

  if (isPending) return <Skeleton className="h-48 w-full" />
  if (user)
    return <AuthLoggedIn user={user} isSigningOut={isSigningOut} onSignOut={handleSignOut} />
  return <SignInForm />
}
