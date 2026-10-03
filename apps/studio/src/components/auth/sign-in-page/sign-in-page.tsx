import { useSearch } from '@tanstack/react-router'
import { SignInForm } from '@/components/auth/sign-in-form'
import { SIGN_IN_DESCRIPTION, SIGN_IN_TITLE } from './lib'

export function SignInPage() {
  const { redirect, error } = useSearch({ from: '/sign-in' })

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold">{SIGN_IN_TITLE}</h1>
        <p className="text-muted-foreground">{SIGN_IN_DESCRIPTION}</p>
      </div>
      <SignInForm redirect={redirect} linkError={error} />
    </div>
  )
}
