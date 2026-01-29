import { Link } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { signIn, signOut, useSession } from '@/integrations/auth'

function AuthSection() {
  const { data: session, isPending } = useSession()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    try {
      const result = await signIn.magicLink({ email })
      if (result.error) {
        setMessage({ type: 'error', text: result.error.message || 'Failed to send magic link' })
      } else {
        setMessage({ type: 'success', text: 'Magic link sent! Check your console (dev mode).' })
        setEmail('')
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send magic link',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
    } finally {
      setIsLoading(false)
    }
  }

  if (isPending) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading session...</p>
        </CardContent>
      </Card>
    )
  }

  if (session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Authenticated
            <Badge variant="default">Logged In</Badge>
          </CardTitle>
          <CardDescription>You are signed in and can access protected features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {session.user.image && (
              <img
                src={session.user.image}
                alt={session.user.name}
                className="h-12 w-12 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{session.user.name}</p>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" disabled={isLoading}>
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Authentication
          <Badge variant="secondary">Guest</Badge>
        </CardTitle>
        <CardDescription>
          Sign in with a magic link to access protected features like sending chat messages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleMagicLink} className="space-y-4">
          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === 'error'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-green-500/10 text-green-600'
              }`}
            >
              {message.text}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            In development, the magic link URL is logged to the server console.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function FeatureCard({
  title,
  description,
  href,
  badge,
}: {
  title: string
  description: string
  href: string
  badge?: string
}) {
  return (
    <Link to={href}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            {badge && <Badge variant="outline">{badge}</Badge>}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

function CodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
      <code className={`language-${language}`}>{code.trim()}</code>
    </pre>
  )
}

export function ComponentExample() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">Studio Demo</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A modern full-stack monorepo template with TanStack Start, tRPC, Better Auth, and
            real-time SSE subscriptions.
          </p>
        </div>

        {/* Auth Section */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">Authentication</h2>
          <AuthSection />
        </section>

        <Separator className="my-8" />

        {/* Interactive Examples */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">Interactive Examples</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <FeatureCard
              title="Todos Example"
              description="CRUD operations with real-time SSE updates. Create, update, and delete todos with instant synchronization."
              href="/todos"
              badge="SSE"
            />
            <FeatureCard
              title="Chat Example"
              description="Real-time global chat using tRPC subscriptions. Requires authentication to send messages."
              href="/chat"
              badge="Auth Required"
            />
          </div>
        </section>

        <Separator className="my-8" />

        {/* Tech Stack */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">Tech Stack</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>TanStack Start</CardTitle>
                <CardDescription>Full-stack React framework</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  File-based routing, SSR, API routes, and middleware out of the box.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>tRPC</CardTitle>
                <CardDescription>End-to-end typesafe APIs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Type-safe queries, mutations, and SSE subscriptions with automatic inference.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Better Auth</CardTitle>
                <CardDescription>Modern authentication</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Email/password, OAuth providers, passkeys, and magic links.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Code Examples */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">Code Examples</h2>
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
                  <CardDescription>
                    Define type-safe procedures with input validation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={`
// packages/studio/trpc/src/routers/chat/mutations.ts
import { protectedProcedure, router } from '../../init'
import { z } from 'zod'

export const chatMutations = router({
  sendMessage: protectedProcedure
    .input(z.object({ content: z.string().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      const message = await createChatMessage({
        content: input.content,
        authorId: ctx.user.id,
        authorName: ctx.user.name,
      })
      if (message) chatEvents.emitMessage(message)
      return message
    }),
})
                    `}
                  />
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
                  <CodeBlock
                    code={`
// Using tRPC with TanStack Query
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc'

function TodosComponent() {
  const trpc = useTRPC()

  // Query todos
  const { data: todos } = useQuery(
    trpc.todos.list.queryOptions()
  )

  // Create mutation
  const createMutation = useMutation(
    trpc.todos.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.todos.list.queryKey()
        })
      },
    })
  )
}
                    `}
                  />
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
                  <CodeBlock
                    code={`
// SSE subscription for real-time updates
import { trpcClient } from '@/integrations/trpc'

useEffect(() => {
  const unsubscribe = trpcClient.chat.onMessage.subscribe(undefined, {
    onData: (data) => {
      if (data.type === 'init') {
        // Initial messages loaded
        setMessages(data.messages)
      } else if (data.type === 'message') {
        // New message received
        setMessages((prev) => [...prev, data.message])
      }
    },
    onError: (err) => {
      console.error('SSE error:', err)
    },
  })

  return () => unsubscribe.unsubscribe()
}, [])
                    `}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        <Separator className="my-8" />

        {/* UI Components */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">UI Components</h2>
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Various button styles available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Status indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Inputs</CardTitle>
                <CardDescription>Text input fields</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input placeholder="Default input" />
                <Input placeholder="Disabled input" disabled />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>Built with TanStack Start, tRPC, Better Auth, Drizzle ORM, and Tailwind CSS</p>
        </footer>
      </div>
    </div>
  )
}
