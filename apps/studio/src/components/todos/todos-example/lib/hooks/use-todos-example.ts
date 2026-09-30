import { type FormEvent, useState } from 'react'
import { useTodoActions } from './use-todo-actions'
import { useTodosList } from './use-todos-list'

export function useTodosExample() {
  const [completedWrites, setCompletedWrites] = useState(0)
  const {
    query: { data: todos = [], isLoading, error },
    queryKey,
  } = useTodosList()
  const actions = useTodoActions(queryKey, () => setCompletedWrites((n) => n + 1))

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
    completedWrites,
    isPending: actions.isPending,
    handleCreateTodo,
    handleToggleTodo,
    handleDeleteTodo,
  }
}
