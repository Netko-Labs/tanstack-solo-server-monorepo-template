import { useLoaderData } from '@tanstack/react-router'
import { useState } from 'react'
import { useSessionUser } from '@/components/shared/session'
import { signOut } from '@/integrations/auth'

export function useAuthSection() {
  const { user: initialUser } = useLoaderData({ from: '/' })
  const { user, isPending } = useSessionUser(initialUser)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return { user, isPending, isSigningOut, handleSignOut }
}
