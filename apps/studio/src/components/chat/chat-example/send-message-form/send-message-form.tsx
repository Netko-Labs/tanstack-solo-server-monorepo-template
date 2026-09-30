import { Button } from '@temp-repo/ui/components/button'
import { Input } from '@temp-repo/ui/components/input'
import { type FormEvent, useState } from 'react'
import type { SendMessageFormProps } from '../lib'
import { MESSAGE_MAX_LENGTH, SEND_LABEL, SEND_PENDING_LABEL, SEND_PLACEHOLDER } from '../lib'

export function SendMessageForm({ onSend, isPending, error }: SendMessageFormProps) {
  const [content, setContent] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (await onSend(content)) setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          aria-label={SEND_PLACEHOLDER}
          placeholder={SEND_PLACEHOLDER}
          value={content}
          maxLength={MESSAGE_MAX_LENGTH}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPending}
          className="flex-1"
        />
        <Button type="submit" disabled={isPending || !content.trim()}>
          {isPending ? SEND_PENDING_LABEL : SEND_LABEL}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
