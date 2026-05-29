import { createFileRoute } from '@tanstack/react-router'
import { TodosExample } from '@/components/todos/todos-example/todos-example'

export const Route = createFileRoute('/todos')({ component: TodosExample })
