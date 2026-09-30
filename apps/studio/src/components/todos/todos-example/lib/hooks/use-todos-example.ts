import { type FormEvent, useState } from 'react'
import type { TodoWriteCounts } from '../types'
import { useTodoActions } from './use-todo-actions'
import { useTodosList } from './use-todos-list'

/** `enabled` gates the list query: guests render nothing, so they should fetch nothing. */
export function useTodosExample(enabled: boolean) {
  const [writes, setWrites] = useState<TodoWriteCounts>({ completed: 0, creates: 0 })
  const {
    query: { data: todos = [], isLoading, error },
    queryKey,
  } = useTodosList(enabled)
  const actions = useTodoActions(queryKey, (action) =>
    setWrites((w) => ({
      completed: w.completed + 1,
      creates: action.type === 'create' ? w.creates + 1 : w.creates,
    })),
  )

  const handleCreateTodo = (e: FormEvent, title: string, description: string) => {
    e.preventDefault()
    if (!title.trim()) return
    actions.dispatch({ type: 'create', input: { title, description: description || null } })
  }
  const handleToggleTodo = (todoId: string, completed: boolean) =>
    actions.dispatch({ type: 'toggle', todoId, completed: !completed })
  const handleDeleteTodo = (todoId: string) => actions.dispatch({ type: 'delete', todoId })

  return {
    todos,
    isLoading,
    error: error?.message ?? actions.error,
    completedWrites: writes.completed,
    completedCreates: writes.creates,
    isPending: actions.isPending,
    handleCreateTodo,
    handleToggleTodo,
    handleDeleteTodo,
  }
}
