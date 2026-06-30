import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useEffect, useState } from 'react'
import { trpcClient, useTRPC } from '@/integrations/trpc'
import type { TodoUpdateEvent } from '../types'
import { formatSubscriptionUpdate } from '../utils'

export function useTodosExample() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [lastUpdate, setLastUpdate] = useState('')

  const { data: todos = [], isLoading, error } = useQuery(trpc.todos.list.queryOptions())

  const createMutation = useMutation(
    trpc.todos.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      },
    }),
  )

  const toggleMutation = useMutation(
    trpc.todos.toggleComplete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      },
    }),
  )

  const deleteMutation = useMutation(
    trpc.todos.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      },
    }),
  )

  useEffect(() => {
    const unsubscribe = trpcClient.todos.onUpdate.subscribe(undefined, {
      onData: (data: TodoUpdateEvent) => {
        queryClient.setQueryData(trpc.todos.list.queryKey(), data.todos)
        setLastUpdate(formatSubscriptionUpdate(data.type, data.timestamp))
      },
      onError: (err: unknown) => {
        console.error('SSE subscription error:', err)
      },
    })

    return () => {
      unsubscribe.unsubscribe()
    }
  }, [queryClient, trpc.todos.list])

  const handleCreateTodo = (e: FormEvent, title: string, description: string) => {
    e.preventDefault()
    if (!title.trim()) return

    createMutation.mutate({
      title,
      description: description || undefined,
    })
  }

  const handleToggleTodo = (todoId: string, completed: boolean) => {
    toggleMutation.mutate({ todoId, completed: !completed })
  }

  const handleDeleteTodo = (todoId: string) => {
    deleteMutation.mutate({ todoId })
  }

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
