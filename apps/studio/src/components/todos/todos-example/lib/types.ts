import type { Todo } from '@temp-repo/studio-domain'

export interface TodoDraft {
  title: string
  description: string
}

export interface TodoIssue {
  path: ReadonlyArray<PropertyKey>
}

export interface TodoItemProps {
  todo: Todo
  isToggling: boolean
  isDeleting: boolean
  onToggle: (todo: Todo) => void
  onDelete: (todoId: string) => void
}

export interface TodoItemRowProps extends TodoItemProps {
  showSeparator: boolean
}
