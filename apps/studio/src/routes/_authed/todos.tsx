import { createFileRoute } from '@tanstack/react-router'
import { pageTitle } from '@/components/core/root'
import { TODOS_PAGE_TITLE, TodosExample } from '@/components/todos/todos-example'

export const Route = createFileRoute('/_authed/todos')({
  head: () => ({ meta: [{ title: pageTitle(TODOS_PAGE_TITLE) }] }),
  component: TodosExample,
})
