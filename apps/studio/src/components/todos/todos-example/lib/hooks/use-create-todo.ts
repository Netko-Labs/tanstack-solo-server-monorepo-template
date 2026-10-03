import { useMutation } from '@tanstack/react-query'
import { TodoCreateInputSchema } from '@temp-repo/studio-domain'
import { type FormEvent, useState } from 'react'
import { useTRPC } from '@/integrations/trpc'
import type { TodoDraft } from '../types'
import { todoErrorMessage, todoIssueMessage, toTodoCreateInput } from '../utils'
import { EMPTY_TODO_DRAFT } from '../values'
import { useInvalidateTodos } from './use-invalidate-todos'

export function useCreateTodo() {
  const trpc = useTRPC()
  const invalidateTodos = useInvalidateTodos()
  const [draft, setDraft] = useState<TodoDraft>(EMPTY_TODO_DRAFT)
  const [issue, setIssue] = useState<string | null>(null)
  const mutation = useMutation(
    trpc.todos.create.mutationOptions({
      onSuccess: () => {
        setDraft(EMPTY_TODO_DRAFT)
        return invalidateTodos()
      },
    }),
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = TodoCreateInputSchema.safeParse(toTodoCreateInput(draft))
    setIssue(parsed.success ? null : todoIssueMessage(parsed.error.issues))
    if (parsed.success) mutation.mutate(parsed.data)
  }

  return {
    draft,
    setTitle: (title: string) => setDraft((prev) => ({ ...prev, title })),
    setDescription: (description: string) => setDraft((prev) => ({ ...prev, description })),
    issue,
    error: todoErrorMessage(mutation.error),
    isPending: mutation.isPending,
    submit,
  }
}
