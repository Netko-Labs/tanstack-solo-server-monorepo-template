import { type FormEvent, useState } from 'react'
import { signIn, signOut, useSession } from '@/integrations/auth'
import type { AuthFormState } from '../types'
import { AUTH_MAGIC_LINK_ERROR, AUTH_MAGIC_LINK_SUCCESS } from '../values'

const INITIAL_FORM: AuthFormState = { email: '', isLoading: false, message: null }

export function useAuthSection() {
  const { data: session, isPending } = useSession()
  const [form, setForm] = useState<AuthFormState>(INITIAL_FORM)
  const patch = (next: Partial<AuthFormState>) => setForm((prev) => ({ ...prev, ...next }))

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault()
    patch({ isLoading: true, message: null })
    try {
      const result = await signIn.magicLink({ email: form.email })
      if (result.error) {
        patch({ message: { type: 'error', text: result.error.message || AUTH_MAGIC_LINK_ERROR } })
      } else {
        patch({ email: '', message: { type: 'success', text: AUTH_MAGIC_LINK_SUCCESS } })
      }
    } catch (err) {
      patch({
        message: {
          type: 'error',
          text: err instanceof Error ? err.message : AUTH_MAGIC_LINK_ERROR,
        },
      })
    } finally {
      patch({ isLoading: false })
    }
  }

  const handleSignOut = async () => {
    patch({ isLoading: true })
    try {
      await signOut()
    } finally {
      patch({ isLoading: false })
    }
  }

  return {
    session,
    isPending,
    email: form.email,
    setEmail: (email: string) => patch({ email }),
    isLoading: form.isLoading,
    message: form.message,
    handleMagicLink,
    handleSignOut,
  }
}
