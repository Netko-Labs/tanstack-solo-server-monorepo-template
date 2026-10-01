import { TODO_DESCRIPTION_MAX, TODO_TITLE_MAX } from '@temp-repo/studio-domain'
import { Button } from '@temp-repo/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@temp-repo/ui/components/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@temp-repo/ui/components/field'
import { Input } from '@temp-repo/ui/components/input'
import { Textarea } from '@temp-repo/ui/components/textarea'
import {
  CREATE_TODO_DESCRIPTION,
  CREATE_TODO_DESCRIPTION_LABEL,
  CREATE_TODO_DESCRIPTION_PLACEHOLDER,
  CREATE_TODO_PENDING_LABEL,
  CREATE_TODO_SUBMIT_LABEL,
  CREATE_TODO_TITLE,
  CREATE_TODO_TITLE_LABEL,
  CREATE_TODO_TITLE_PLACEHOLDER,
  useCreateTodo,
} from '../lib'

export function CreateTodoForm() {
  const { draft, setTitle, setDescription, issue, error, isPending, submit } = useCreateTodo()
  const message = issue ?? error

  return (
    <Card>
      <CardHeader>
        <CardTitle>{CREATE_TODO_TITLE}</CardTitle>
        <CardDescription>{CREATE_TODO_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="todo-title">{CREATE_TODO_TITLE_LABEL}</FieldLabel>
              <Input
                id="todo-title"
                placeholder={CREATE_TODO_TITLE_PLACEHOLDER}
                value={draft.title}
                maxLength={TODO_TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="todo-description">{CREATE_TODO_DESCRIPTION_LABEL}</FieldLabel>
              <Textarea
                id="todo-description"
                placeholder={CREATE_TODO_DESCRIPTION_PLACEHOLDER}
                value={draft.description}
                maxLength={TODO_DESCRIPTION_MAX}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            {message && <FieldError>{message}</FieldError>}
            <Button type="submit" disabled={isPending}>
              {isPending ? CREATE_TODO_PENDING_LABEL : CREATE_TODO_SUBMIT_LABEL}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
