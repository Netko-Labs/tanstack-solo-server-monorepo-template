import { Button } from '@temp-repo/ui/components/button'
import { Checkbox } from '@temp-repo/ui/components/checkbox'
import { Separator } from '@temp-repo/ui/components/separator'
import { Fragment } from 'react'
import { formatDateTime } from '@/shared/format-date'
import type { TodoItemProps, TodoItemRowProps } from '../../lib'

export function TodoItem({ todo, onToggle, onDelete, isPending }: TodoItemProps) {
  return (
    <div className="flex items-start gap-4">
      <Checkbox
        aria-label={`Complete ${todo.title}`}
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id, todo.completed)}
        className="mt-1"
        disabled={isPending('toggle', todo.id)}
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
          Created: {formatDateTime(todo.createdAt)}
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        aria-label={`Delete ${todo.title}`}
        onClick={() => onDelete(todo.id)}
        disabled={isPending('delete', todo.id)}
      >
        Delete
      </Button>
    </div>
  )
}

export function TodoItemRow({ todo, showSeparator, ...props }: TodoItemRowProps) {
  return (
    <Fragment>
      {showSeparator && <Separator />}
      <TodoItem todo={todo} {...props} />
    </Fragment>
  )
}
