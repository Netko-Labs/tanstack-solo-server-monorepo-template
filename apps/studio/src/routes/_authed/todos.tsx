import { createFileRoute } from '@tanstack/react-router'
import { TodosExample } from '@/components/todos/todos-example'

export const Route = createFileRoute('/_authed/todos')({ component: TodosExample })
