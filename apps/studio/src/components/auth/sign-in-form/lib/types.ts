export interface SignInFormProps {
  redirect?: string
  linkError?: string
}

export interface SignInMessage {
  type: 'success' | 'error'
  text: string
}

export interface SignInFormState {
  email: string
  isSending: boolean
  message: SignInMessage | null
}

export interface SignInAuthError {
  code?: string
  status: number
}
