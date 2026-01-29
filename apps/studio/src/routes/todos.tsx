import { createFileRoute } from '@tanstack/react-router'
import { TodosExample } from '@/components/todos-example'

export const Route = createFileRoute('/todos')({ component: TodosPage })

function TodosPage() {
  return <TodosExample />
}
