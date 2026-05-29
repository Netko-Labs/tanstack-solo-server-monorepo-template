import type { FormEvent } from 'react'

export interface FeatureCardProps {
  title: string
  description: string
  href: string
  badge?: string
}

export interface CodeBlockProps {
  code: string
  language?: string
}

export interface AuthMessage {
  type: 'success' | 'error'
  text: string
}

export interface AuthLoggedInProps {
  session: {
    user: {
      name: string
      email: string
      image?: string | null
    }
  }
  isLoading: boolean
  onSignOut: () => void
}

export interface AuthGuestFormProps {
  email: string
  isLoading: boolean
  message: AuthMessage | null
  onEmailChange: (email: string) => void
  onSubmit: (event: FormEvent) => void
}
