import { type FormEvent, useState } from 'react'
import { useTodoActions } from './use-todo-actions'
import { useTodosList } from './use-todos-list'

export function useTodosExample() {
  const [lastUpdate, setLastUpdate] = useState('')
  const {
    query: { data: todos = [], isLoading, error },
    queryKey,
  } = useTodosList()
  const { dispatch, isPending } = useTodoActions(queryKey, () =>
    setLastUpdate(new Date().toLocaleTimeString()),
  )

  const handleCreateTodo = (e: FormEvent, title: string, description: string) => {
    e.preventDefault()
    if (!title.trim()) return
    dispatch({ type: 'create', input: { title, description: description || undefined } })
  }
  const handleToggleTodo = (todoId: string, completed: boolean) =>
    dispatch({ type: 'toggle', todoId, completed: !completed })
  const handleDeleteTodo = (todoId: string) => dispatch({ type: 'delete', todoId })

  return {
    todos,
    isLoading,
    error,
    lastUpdate,
    createMutation: { isPending: isPending('create') },
    toggleMutation: { isPending: isPending('toggle') },
    deleteMutation: { isPending: isPending('delete') },
    handleCreateTodo,
    handleToggleTodo,
    handleDeleteTodo,
  }
}
