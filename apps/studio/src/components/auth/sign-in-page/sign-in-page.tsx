import { AuthSection } from '@/components/home/component-example/auth-section'
import { SIGN_IN_DESCRIPTION, SIGN_IN_TITLE } from './lib'

export function SignInPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold">{SIGN_IN_TITLE}</h1>
        <p className="text-muted-foreground">{SIGN_IN_DESCRIPTION}</p>
      </div>
      <AuthSection />
    </div>
  )
}
