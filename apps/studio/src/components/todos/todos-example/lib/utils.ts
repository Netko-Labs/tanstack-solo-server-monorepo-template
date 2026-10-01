import type { TodoCreateInput } from '@temp-repo/studio-domain'
import { toUserMessage } from '@/shared/trpc-error'
import type { TodoDraft, TodoIssue } from './types'
import {
  TODO_DESCRIPTION_ISSUE,
  TODO_ERROR_COPY,
  TODO_INPUT_ISSUE,
  TODO_TITLE_ISSUE,
} from './values'

export function toTodoCreateInput({ title, description }: TodoDraft): TodoCreateInput {
  return { title: title.trim(), description: description.trim() || null }
}

export function todoIssueMessage(issues: ReadonlyArray<TodoIssue>): string | null {
  const [first] = issues
  if (!first) return null
  if (first.path[0] === 'title') return TODO_TITLE_ISSUE
  if (first.path[0] === 'description') return TODO_DESCRIPTION_ISSUE
  return TODO_INPUT_ISSUE
}

export const todoErrorMessage = (error: unknown) => toUserMessage(error, TODO_ERROR_COPY)

/** Mutation-cache variables are untyped; read the row id only when it is there. */
export function todoIdOf(variables: unknown): string | undefined {
  if (typeof variables !== 'object' || variables === null || !('todoId' in variables)) return
  return typeof variables.todoId === 'string' ? variables.todoId : undefined
}
