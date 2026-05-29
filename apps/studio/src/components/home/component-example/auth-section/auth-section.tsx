import { Card, CardContent } from '@temp-repo/ui/components/card'
import { AUTH_LOADING } from '../definitions'
import { AuthGuestForm } from './auth-guest-form'
import { AuthLoggedIn } from './auth-logged-in'
import { useAuthSection } from './use-auth-section'

export function AuthSection() {
  const {
    session,
    isPending,
    email,
    setEmail,
    isLoading,
    message,
    handleMagicLink,
    handleSignOut,
  } = useAuthSection()

  if (isPending) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">{AUTH_LOADING}</p>
        </CardContent>
      </Card>
    )
  }

  if (session?.user) {
    return <AuthLoggedIn session={session} isLoading={isLoading} onSignOut={handleSignOut} />
  }

  return (
    <AuthGuestForm
      email={email}
      isLoading={isLoading}
      message={message}
      onEmailChange={setEmail}
      onSubmit={handleMagicLink}
    />
  )
}
