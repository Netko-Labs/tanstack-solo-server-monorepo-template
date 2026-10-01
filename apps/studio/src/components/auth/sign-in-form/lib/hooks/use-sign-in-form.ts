import { SignInEmailSchema } from '@temp-repo/studio-domain'
import { type FormEvent, useState } from 'react'
import { signIn } from '@/integrations/auth'
import type { SignInFormProps, SignInFormState } from '../types'
import { initialSignInForm, signInErrorCallbackUrl, signInErrorMessage } from '../utils'
import { SIGN_IN_ERROR, SIGN_IN_INVALID_EMAIL, SIGN_IN_LINK_SENT } from '../values'

export function useSignInForm({ redirect, linkError }: SignInFormProps) {
  const [form, setForm] = useState<SignInFormState>(() => initialSignInForm(linkError))
  const patch = (next: Partial<SignInFormState>) => setForm((prev) => ({ ...prev, ...next }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = SignInEmailSchema.safeParse({ email: form.email })
    if (!parsed.success) {
      patch({ message: { type: 'error', text: SIGN_IN_INVALID_EMAIL } })
      return
    }
    patch({ isSending: true, message: null })
    try {
      const result = await signIn.magicLink({
        email: parsed.data.email,
        callbackURL: redirect ?? '/',
        errorCallbackURL: signInErrorCallbackUrl(redirect),
      })
      patch(
        result.error
          ? { message: { type: 'error', text: signInErrorMessage(result.error) } }
          : { email: '', message: { type: 'success', text: SIGN_IN_LINK_SENT } },
      )
    } catch {
      patch({ message: { type: 'error', text: SIGN_IN_ERROR } })
    } finally {
      patch({ isSending: false })
    }
  }

  return {
    email: form.email,
    setEmail: (email: string) => patch({ email }),
    isSending: form.isSending,
    message: form.message,
    handleSubmit,
  }
}
