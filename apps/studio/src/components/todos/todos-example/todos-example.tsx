import { Card, CardContent } from '@temp-repo/ui/components/card'
import { CreateTodoForm } from './create-todo-form'
import { ImplementationInfo } from './implementation-info'
import { TODOS_PAGE_DESCRIPTION, TODOS_PAGE_TITLE, useTodosExample } from './lib'
import { TodoList } from './todo-list'
import { TransportInfo } from './transport-info'

export function TodosExample() {
  const todos = useTodosExample()

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{TODOS_PAGE_TITLE}</h1>
        <p className="text-muted-foreground">{TODOS_PAGE_DESCRIPTION}</p>
      </div>

      <TransportInfo completedWrites={todos.completedWrites} />
      {/* Remount on each accepted create so the fields clear then, and only then. */}
      <CreateTodoForm
        key={todos.completedCreates}
        onSubmit={todos.handleCreateTodo}
        isPending={todos.isPending('create')}
      />
      {todos.error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p role="alert" className="text-destructive">
              {todos.error}
            </p>
          </CardContent>
        </Card>
      )}
      <TodoList
        todos={todos.todos}
        isLoading={todos.isLoading}
        onToggle={todos.handleToggleTodo}
        onDelete={todos.handleDeleteTodo}
        isPending={todos.isPending}
      />

      <ImplementationInfo />
    </div>
  )
}
