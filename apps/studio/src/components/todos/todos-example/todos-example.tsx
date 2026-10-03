import { useLoaderData } from '@tanstack/react-router'
import { displayName } from '@temp-repo/studio-domain'
import { CreateTodoForm } from './create-todo-form'
import { ImplementationInfo } from './implementation-info'
import { TODOS_PAGE_DESCRIPTION, TODOS_PAGE_TITLE, TODOS_SIGNED_IN_AS } from './lib'
import { TodoList } from './todo-list'
import { TransportInfo } from './transport-info'

export function TodosExample() {
  const { session } = useLoaderData({ from: '/_authed' })

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{TODOS_PAGE_TITLE}</h1>
        <p className="text-muted-foreground">{TODOS_PAGE_DESCRIPTION}</p>
        <p className="text-sm text-muted-foreground">
          {TODOS_SIGNED_IN_AS} {displayName(session)}
        </p>
      </div>
      <TransportInfo />
      <CreateTodoForm />
      <TodoList />
      <ImplementationInfo />
    </div>
  )
}
