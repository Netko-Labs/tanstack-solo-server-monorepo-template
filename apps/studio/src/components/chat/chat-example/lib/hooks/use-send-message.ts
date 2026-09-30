import { useMutation } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/trpc'

/** Resolves true when the message was accepted, so the form clears only on success. */
export function useSendMessage(roomId: string) {
  const mutation = useMutation({
    mutationFn: (content: string) => trpcClient.room.send.mutate({ roomId, content }),
  })
  const send = async (content: string): Promise<boolean> => {
    if (!content.trim()) return false
    try {
      await mutation.mutateAsync(content)
      return true
    } catch {
      return false
    }
  }
  return { send, isPending: mutation.isPending, error: mutation.error?.message }
}
