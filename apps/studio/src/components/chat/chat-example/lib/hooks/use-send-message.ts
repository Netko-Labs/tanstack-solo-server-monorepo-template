import { useMutation } from '@tanstack/react-query'
import { ChatMessageSendInputSchema } from '@temp-repo/studio-domain'
import { type FormEvent, useState } from 'react'
import { useTRPC } from '@/integrations/trpc'
import { toUserMessage } from '@/shared/trpc-error'

/** The draft clears only once the server accepted it; the room stream delivers the message. */
export function useSendMessage(roomId: string) {
  const trpc = useTRPC()
  const [content, setContent] = useState('')
  const mutation = useMutation(trpc.room.send.mutationOptions({ onSuccess: () => setContent('') }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = ChatMessageSendInputSchema.safeParse({ roomId, content: content.trim() })
    if (parsed.success) mutation.mutate(parsed.data)
  }

  return {
    content,
    setContent,
    canSend: content.trim().length > 0 && !mutation.isPending,
    isPending: mutation.isPending,
    error: toUserMessage(mutation.error),
    submit,
  }
}
