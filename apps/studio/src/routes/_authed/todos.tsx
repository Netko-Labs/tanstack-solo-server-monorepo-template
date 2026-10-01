import { createFileRoute } from '@tanstack/react-router'
import { pageTitle } from '@/components/core/root'
import { TodosExample } from '@/components/todos/todos-example'

export const Route = createFileRoute('/_authed/todos')({
  head: () => ({ meta: [{ title: pageTitle('Todos') }] }),
  component: TodosExample,
})
