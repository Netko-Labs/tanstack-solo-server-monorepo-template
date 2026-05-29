import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@temp-repo/ui/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@temp-repo/ui/components/tabs'
import { CodeBlock } from '../code-block/code-block'
import { CODE_EXAMPLE_QUERY, CODE_EXAMPLE_SUBSCRIPTION, CODE_EXAMPLE_TRPC } from '../definitions'

export function CodeExamples() {
  return (
    <Tabs defaultValue="trpc">
      <TabsList>
        <TabsTrigger value="trpc">tRPC Router</TabsTrigger>
        <TabsTrigger value="query">React Query</TabsTrigger>
        <TabsTrigger value="subscription">SSE Subscription</TabsTrigger>
      </TabsList>

      <TabsContent value="trpc" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>tRPC Router Definition</CardTitle>
            <CardDescription>Define type-safe procedures with input validation</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={CODE_EXAMPLE_TRPC} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="query" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>TanStack Query Integration</CardTitle>
            <CardDescription>Use tRPC with React Query for data fetching</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={CODE_EXAMPLE_QUERY} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="subscription" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>SSE Subscriptions</CardTitle>
            <CardDescription>Real-time updates via Server-Sent Events</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={CODE_EXAMPLE_SUBSCRIPTION} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
