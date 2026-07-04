import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { realtime } from '@/integrations/realtime'

const TODOS_QUERY_KEY = ['todos'] as const

export function useTodosExample() {
  const queryClient = useQueryClient()
  const [lastUpdate, setLastUpdate] = useState('')

  const {
    data: todos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: TODOS_QUERY_KEY,
    queryFn: () => realtime.todos.list.query(),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
    setLastUpdate(new Date().toLocaleTimeString())
  }

  const createMutation = useMutation({
    mutationFn: (input: { title: string; description?: string }) =>
      realtime.todos.create.mutate(input),
    onSuccess: invalidate,
  })
  const toggleMutation = useMutation({
    mutationFn: ({ todoId, completed }: { todoId: string; completed: boolean }) =>
      realtime.todos.update.mutate({ todoId, completed }),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({
    mutationFn: (todoId: string) => realtime.todos.delete.mutate({ todoId }),
    onSuccess: invalidate,
  })

  const handleCreateTodo = (e: FormEvent, title: string, description: string) => {
    e.preventDefault()
    if (!title.trim()) return
    createMutation.mutate({ title, description: description || undefined })
  }
  const handleToggleTodo = (todoId: string, completed: boolean) =>
    toggleMutation.mutate({ todoId, completed: !completed })
  const handleDeleteTodo = (todoId: string) => deleteMutation.mutate(todoId)

  return {
    todos,
    isLoading,
    error,
    lastUpdate,
    createMutation,
    toggleMutation,
    deleteMutation,
    handleCreateTodo,
    handleToggleTodo,
    handleDeleteTodo,
  }
}
