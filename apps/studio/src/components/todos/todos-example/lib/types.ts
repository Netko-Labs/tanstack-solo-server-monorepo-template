import type { Todo, TodoCreateInput } from '@temp-repo/studio-domain'
import type { FormEvent } from 'react'

export type TodoAction =
  | { type: 'create'; input: TodoCreateInput }
  | { type: 'toggle'; todoId: string; completed: boolean }
  | { type: 'delete'; todoId: string }

export type TodoPendingCheck = (type: TodoAction['type'], todoId?: string) => boolean

export interface CreateTodoFormProps {
  onSubmit: (e: FormEvent, title: string, description: string) => void
  isPending: boolean
}

export interface TodoListProps {
  todos: Todo[]
  isLoading: boolean
  onToggle: (todoId: string, completed: boolean) => void
  onDelete: (todoId: string) => void
  isPending: TodoPendingCheck
}

export interface TodoItemProps {
  todo: Todo
  onToggle: (todoId: string, completed: boolean) => void
  onDelete: (todoId: string) => void
  isPending: TodoPendingCheck
}

export interface TodoItemRowProps extends TodoItemProps {
  showSeparator: boolean
}

export interface TransportInfoProps {
  completedWrites: number
}
