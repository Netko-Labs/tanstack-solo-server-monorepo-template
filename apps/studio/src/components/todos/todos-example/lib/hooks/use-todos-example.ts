import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { useTRPC } from '@/integrations/trpc'

export function useTodosExample() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [lastUpdate, setLastUpdate] = useState('')

  const { data: todos = [], isLoading, error } = useQuery(trpc.todos.list.queryOptions())

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
    setLastUpdate(new Date().toLocaleTimeString())
  }

  const createMutation = useMutation(trpc.todos.create.mutationOptions({ onSuccess: invalidate }))
  const toggleMutation = useMutation(trpc.todos.update.mutationOptions({ onSuccess: invalidate }))
  const deleteMutation = useMutation(trpc.todos.delete.mutationOptions({ onSuccess: invalidate }))

  const handleCreateTodo = (e: FormEvent, title: string, description: string) => {
    e.preventDefault()
    if (!title.trim()) return
    createMutation.mutate({ title, description: description || undefined })
  }
  const handleToggleTodo = (todoId: string, completed: boolean) =>
    toggleMutation.mutate({ todoId, completed: !completed })
  const handleDeleteTodo = (todoId: string) => deleteMutation.mutate({ todoId })

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
