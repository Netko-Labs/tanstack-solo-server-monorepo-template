import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Todo } from '@temp-repo/web-domain'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { httpTrpcClient, useTRPC, wsTrpcClient } from '@/integrations/trpc'

interface TodoUpdateEvent {
  id: string
  type: 'sync' | 'update'
  todos: Todo[]
  timestamp: number
}

/**
 * Example component demonstrating todos with tRPC + TanStack Query
 * Includes queries, mutations, and both types of subscriptions
 */
export function TodosExample() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [subscriptionType, setSubscriptionType] = React.useState<'sse' | 'ws'>('sse')
  const [lastUpdate, setLastUpdate] = React.useState<string>('')

  // Form state
  const [newTitle, setNewTitle] = React.useState('')
  const [newDescription, setNewDescription] = React.useState('')

  // Query todos using TanStack Query
  const { data: todos = [], isLoading, error } = useQuery(trpc.todos.list.queryOptions())

  // Create mutation
  const createMutation = useMutation(
    trpc.todos.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
        setNewTitle('')
        setNewDescription('')
      },
    }),
  )

  // Toggle complete mutation
  const toggleMutation = useMutation(
    trpc.todos.toggleComplete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      },
    }),
  )

  // Delete mutation
  const deleteMutation = useMutation(
    trpc.todos.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      },
    }),
  )

  // SSE subscription (HTTP)
  React.useEffect(() => {
    if (subscriptionType !== 'sse') return

    const unsubscribe = httpTrpcClient.todos.onUpdate.subscribe(undefined, {
      onData: (data: TodoUpdateEvent) => {
        // Update the query cache with new data
        queryClient.setQueryData(trpc.todos.list.queryKey(), data.todos)
        setLastUpdate(`SSE: ${data.type} at ${new Date(data.timestamp).toLocaleTimeString()}`)
      },
      onError: (err: unknown) => {
        console.error('SSE subscription error:', err)
      },
    })

    return () => {
      unsubscribe.unsubscribe()
    }
  }, [subscriptionType, queryClient, trpc.todos.list])

  // WebSocket subscription
  React.useEffect(() => {
    if (subscriptionType !== 'ws') return
    if (typeof window === 'undefined') return // SSR guard

    const unsubscribe = wsTrpcClient.todos.onUpdate.subscribe(undefined, {
      onData: (data: TodoUpdateEvent) => {
        // Update the query cache with new data
        queryClient.setQueryData(trpc.todos.list.queryKey(), data.todos)
        setLastUpdate(`WS: ${data.type} at ${new Date(data.timestamp).toLocaleTimeString()}`)
      },
      onError: (err: unknown) => {
        console.error('WebSocket subscription error:', err)
      },
    })

    return () => {
      unsubscribe.unsubscribe()
    }
  }, [subscriptionType, queryClient, trpc.todos.list])

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    createMutation.mutate({
      title: newTitle,
      description: newDescription || undefined,
    })
  }

  const handleToggleTodo = (todoId: string, completed: boolean) => {
    toggleMutation.mutate({ todoId, completed: !completed })
  }

  const handleDeleteTodo = (todoId: string) => {
    deleteMutation.mutate({ todoId })
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Todos Example</h1>
        <p className="text-muted-foreground">
          Demonstrating tRPC + TanStack Query with queries, mutations, and subscriptions (SSE &
          WebSocket)
        </p>
      </div>

      {/* Subscription Type Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Type</CardTitle>
          <CardDescription>
            Choose between Server-Sent Events (HTTP) or WebSocket (real-time)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            variant={subscriptionType === 'sse' ? 'default' : 'outline'}
            onClick={() => setSubscriptionType('sse')}
          >
            SSE (HTTP)
          </Button>
          <Button
            variant={subscriptionType === 'ws' ? 'default' : 'outline'}
            onClick={() => setSubscriptionType('ws')}
          >
            WebSocket
          </Button>
          {lastUpdate && (
            <Badge variant="secondary" className="ml-auto">
              {lastUpdate}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Create Todo Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Todo</CardTitle>
          <CardDescription>Add a new item to your todo list</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTodo}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="todo-title">Title</FieldLabel>
                <Input
                  id="todo-title"
                  placeholder="Enter todo title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="todo-description">Description (optional)</FieldLabel>
                <Textarea
                  id="todo-description"
                  placeholder="Enter todo description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </Field>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Todo'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Todos List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Todos</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${todos.length} todo${todos.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading todos...</p>
          ) : todos.length === 0 ? (
            <p className="text-muted-foreground">No todos yet. Create one above!</p>
          ) : (
            <div className="space-y-4">
              {todos.map((todo: Todo, index: number) => (
                <React.Fragment key={todo.id}>
                  {index > 0 && <Separator />}
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id, todo.completed)}
                      className="mt-1 h-5 w-5 cursor-pointer"
                      disabled={toggleMutation.isPending}
                    />
                    <div className="flex-1">
                      <h3
                        className={`font-semibold ${todo.completed ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p
                          className={`mt-1 text-sm ${todo.completed ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}
                        >
                          {todo.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Created: {new Date(todo.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTodo(todo.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Implementation Info */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>TanStack Query:</strong> Using <code>useQuery</code> and{' '}
            <code>useMutation</code> with tRPC integration for type-safe data fetching.
          </p>
          <p>
            <strong>SSE (HTTP):</strong> Server-Sent Events via <code>httpSubscriptionLink</code>.
            Polls and pushes updates from the server.
          </p>
          <p>
            <strong>WebSocket:</strong> Real-time bidirectional communication via{' '}
            <code>wsLink</code>. Instant updates.
          </p>
          <p className="text-muted-foreground">
            Try opening this page in multiple browser windows and see the real-time updates!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
