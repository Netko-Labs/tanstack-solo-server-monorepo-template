import { Button } from '@temp-repo/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@temp-repo/ui/components/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@temp-repo/ui/components/empty'
import { Skeleton } from '@temp-repo/ui/components/skeleton'
import {
  LIST_EMPTY,
  LIST_ERROR_TITLE,
  LIST_RETRY,
  LIST_TITLE,
  useDeleteTodo,
  useTodosList,
  useToggleTodo,
} from '../lib'
import { TodoItemRow } from './todo-item'

export function TodoList() {
  const list = useTodosList()
  const toggle = useToggleTodo()
  const remove = useDeleteTodo()
  const writeError = toggle.error ?? remove.error

  return (
    <Card>
      <CardHeader>
        <CardTitle>{LIST_TITLE}</CardTitle>
        {list.todos && (
          <CardDescription>
            {list.todos.length} todo{list.todos.length === 1 ? '' : 's'}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {writeError && (
          <p role="alert" className="text-sm text-destructive">
            {writeError}
          </p>
        )}
        {list.isError ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{LIST_ERROR_TITLE}</EmptyTitle>
              <EmptyDescription>{list.error}</EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" size="sm" onClick={list.retry}>
              {LIST_RETRY}
            </Button>
          </Empty>
        ) : !list.todos ? (
          <Skeleton className="h-24 w-full" />
        ) : list.todos.length === 0 ? (
          <p className="text-muted-foreground">{LIST_EMPTY}</p>
        ) : (
          list.todos.map((todo, index) => (
            <TodoItemRow
              key={todo.id}
              todo={todo}
              showSeparator={index > 0}
              isToggling={toggle.isToggling(todo.id)}
              isDeleting={remove.isDeleting(todo.id)}
              onToggle={toggle.toggle}
              onDelete={remove.remove}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
