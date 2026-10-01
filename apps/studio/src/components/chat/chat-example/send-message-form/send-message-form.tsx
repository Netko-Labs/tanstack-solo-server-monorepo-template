import { CHAT_CONTENT_MAX } from '@temp-repo/studio-domain'
import { Button } from '@temp-repo/ui/components/button'
import { Input } from '@temp-repo/ui/components/input'
import type { SendMessageFormProps } from '../lib'
import { SEND_LABEL, SEND_PENDING_LABEL, SEND_PLACEHOLDER } from '../lib'

export function SendMessageForm({
  content,
  onContentChange,
  onSubmit,
  canSend,
  isPending,
  error,
}: SendMessageFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          aria-label={SEND_PLACEHOLDER}
          placeholder={SEND_PLACEHOLDER}
          value={content}
          maxLength={CHAT_CONTENT_MAX}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={isPending}
          className="flex-1"
        />
        <Button type="submit" disabled={!canSend}>
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
