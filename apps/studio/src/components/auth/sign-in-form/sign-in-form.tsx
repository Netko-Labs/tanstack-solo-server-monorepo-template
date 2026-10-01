import { Badge } from '@temp-repo/ui/components/badge'
import { Button } from '@temp-repo/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@temp-repo/ui/components/card'
import { Input } from '@temp-repo/ui/components/input'
import type { SignInFormProps } from './lib'
import {
  SIGN_IN_DEV_HINT,
  SIGN_IN_EMAIL_LABEL,
  SIGN_IN_EMAIL_PLACEHOLDER,
  SIGN_IN_FORM_BADGE,
  SIGN_IN_FORM_DESCRIPTION,
  SIGN_IN_FORM_TITLE,
  SIGN_IN_SEND_LINK,
  SIGN_IN_SENDING,
  useSignInForm,
} from './lib'

export function SignInForm(props: SignInFormProps) {
  const { email, setEmail, isSending, message, handleSubmit } = useSignInForm(props)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {SIGN_IN_FORM_TITLE}
          <Badge variant="secondary">{SIGN_IN_FORM_BADGE}</Badge>
        </CardTitle>
        <CardDescription>{SIGN_IN_FORM_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {message && (
            <div
              role={message.type === 'error' ? 'alert' : 'status'}
              className={`rounded-md p-3 text-sm ${
                message.type === 'error'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-green-500/10 text-green-600'
              }`}
            >
              {message.text}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {SIGN_IN_EMAIL_LABEL}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={SIGN_IN_EMAIL_PLACEHOLDER}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSending}>
            {isSending ? SIGN_IN_SENDING : SIGN_IN_SEND_LINK}
          </Button>
          <p className="text-xs text-muted-foreground text-center">{SIGN_IN_DEV_HINT}</p>
        </form>
      </CardContent>
    </Card>
  )
}
