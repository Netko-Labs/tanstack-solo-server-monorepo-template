import { Button } from '@temp-repo/ui/components/button'
import { Checkbox } from '@temp-repo/ui/components/checkbox'
import { Separator } from '@temp-repo/ui/components/separator'
import { Fragment } from 'react'
import { formatDateTime } from '@/shared/format-date'
import type { TodoItemProps, TodoItemRowProps } from '../../lib'
import { TODO_CREATED_LABEL, TODO_DELETE_LABEL } from '../../lib'

export function TodoItem({ todo, isToggling, isDeleting, onToggle, onDelete }: TodoItemProps) {
  const done = todo.completed ? 'text-muted-foreground line-through' : ''

  return (
    <div className={`flex items-start gap-4 ${isDeleting ? 'opacity-50' : ''}`}>
      <Checkbox
        aria-label={`Complete ${todo.title}`}
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo)}
        className="mt-1"
        disabled={isToggling || isDeleting}
      />
      <div className="flex-1">
        <h3 className={`font-semibold ${done}`}>{todo.title}</h3>
        {todo.description && (
          <p className={`mt-1 text-sm text-muted-foreground ${done}`}>{todo.description}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {TODO_CREATED_LABEL} {formatDateTime(todo.createdAt)}
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        aria-label={`Delete ${todo.title}`}
        onClick={() => onDelete(todo.id)}
        disabled={isDeleting}
      >
        {TODO_DELETE_LABEL}
      </Button>
    </div>
  )
}

export function TodoItemRow({ showSeparator, ...props }: TodoItemRowProps) {
  return (
    <Fragment>
      {showSeparator && <Separator />}
      <TodoItem {...props} />
    </Fragment>
  )
}
