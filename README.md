# TanStack Solo Server Monorepo Template

A modern, type-safe full-stack template using TanStack Start, tRPC, Drizzle ORM, TanStack Query, and Bun.

## 🚀 Features

- ⚡ **TanStack Start** - Modern React framework with SSR
- 🔄 **tRPC** - End-to-end type-safe APIs
- 📊 **TanStack Query** - Powerful data fetching and caching
- 🗃️ **Drizzle ORM** - Type-safe database access with `drizzle-zod` for automatic schema generation
- 📦 **Turborepo** - High-performance monorepo build system
- 🎨 **Beautiful UI** - Pre-configured component library
- 🔐 **Authentication** - Built-in auth system
- ⚙️ **Bun Runtime** - Fast JavaScript runtime and package manager
- 🔌 **Real-time Subscriptions** - Both SSE (HTTP) and WebSocket support
- 🎯 **TypeScript** - Full type safety across the stack

## 📦 What's Included

### Complete Todos Example

This template includes a **fully implemented todos feature** demonstrating:

- ✅ **CRUD Operations** - Create, Read, Update, Delete
- ✅ **Real-time Updates** - SSE and WebSocket subscriptions
- ✅ **TanStack Query Integration** - `useQuery`, `useMutation` with tRPC
- ✅ **drizzle-zod** - Automatic Zod schema generation from Drizzle tables
- ✅ **Clean Architecture** - Layered design following Netko patterns

## 🏗️ Project Structure

```
.
├── apps/
│   └── web/                    # TanStack Start application
│       └── src/
│           ├── components/     # React components
│           ├── integrations/   # TanStack Query + tRPC setup
│           │   ├── tanstack-query/
│           │   └── trpc/
│           └── routes/         # File-based routing
│
├── packages/
│   └── web/
│       ├── domain/             # Domain layer
│       │   ├── db/             # Drizzle schemas
│       │   └── entities/       # drizzle-zod generated schemas
│       ├── repository/         # Database layer
│       ├── service/            # Business logic
│       │   ├── queries/        # Query functions (folder per entity)
│       │   └── mutations/      # Mutation functions (folder per entity)
│       └── trpc/               # tRPC routers
│           └── routers/
│               └── todos/
│                   ├── queries.ts
│                   ├── mutations.ts
│                   └── subscriptions.ts
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- PostgreSQL database

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp apps/web/sample.env apps/web/.env
cp packages/web/domain/sample.env packages/web/domain/.env

# Edit .env files with your database URL and other settings
```

### Database Setup

```bash
# Generate and apply migrations
cd packages/web/repository
bunx drizzle-kit push
```

### Development

```bash
# Start development server
bun run dev

# Server will start at http://localhost:3000
# Visit http://localhost:3000/todos to see the example
```

## 📖 Architecture Patterns

### Domain Layer (`packages/web/domain`)

**Database Schema** (`src/db/todos.ts`):
```typescript
export const todoTable = pgTable('todo', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').default(false).notNull(),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
})
```

**Entity Schemas** (`src/entities/todos.ts`) - Using `drizzle-zod`:
```typescript
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const TodoInsertSchema = createInsertSchema(todoTable)
export type TodoInsert = z.infer<typeof TodoInsertSchema>

export const TodoUpdateSchema = createUpdateSchema(todoTable).required({ id: true })
export type TodoUpdate = z.infer<typeof TodoUpdateSchema>

export const TodoSchema = createSelectSchema(todoTable)
export type Todo = z.infer<typeof TodoSchema>
```

### Service Layer (`packages/web/service`)

**Queries** (`src/queries/todos/get-todo.ts`):
```typescript
export const getTodo = async (
  todoId: string,
  ctx?: AuthenticatedContext,
): Promise<Todo | undefined> => {
  const where = ctx
    ? and(eq(todoTable.id, todoId), eq(todoTable.createdBy, ctx.user.id))
    : eq(todoTable.id, todoId)

  return await db.select().from(todoTable).where(where).then(([result]) => result)
}
```

**Mutations** (`src/mutations/todos/create-todo.ts`):
```typescript
export const createTodo = async (data: TodoInsert): Promise<Todo | undefined> => {
  return await db.insert(todoTable).values(data).returning().then(([result]) => result)
}
```

### tRPC Layer (`packages/web/trpc`)

**Queries** (`src/routers/todos/queries.ts`):
```typescript
export const todosQueries = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getTodos(ctx.user.id)
  }),

  getById: protectedProcedure
    .input(z.object({ todoId: z.string() }))
    .query(async ({ ctx, input }) => {
      return getTodo(input.todoId, ctx)
    }),
})
```

**Mutations** (`src/routers/todos/mutations.ts`):
```typescript
export const todosMutations = router({
  create: protectedProcedure
    .input(TodoInsertSchema.omit({ createdBy: true }))
    .mutation(async ({ ctx, input }) => {
      return createTodo({ ...input, createdBy: ctx.user.id })
    }),
})
```

**Subscriptions** (`src/routers/todos/subscriptions.ts`):
```typescript
export const todosSubscriptions = router({
  onUpdate: protectedProcedure
    .subscription(async function* ({ ctx, signal }) {
      // Initial data
      yield { id: '0', type: 'sync', todos: await getTodos(ctx.user.id), timestamp: Date.now() }

      // Poll for updates
      while (!signal?.aborted) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        yield { id: String(++eventId), type: 'update', todos: await getTodos(ctx.user.id), timestamp: Date.now() }
      }
    }),
})
```

### Frontend Integration (`apps/web/src/integrations`)

**tRPC Clients**:
- `http-client.ts` - HTTP with SSE support for subscriptions
- `ws-client.ts` - WebSocket client for real-time subscriptions
- `react.ts` - TanStack Query + tRPC context

**Usage in Components**:
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpTrpcClient, useTRPC, wsTrpcClient } from '@/integrations/trpc'

function TodosExample() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Query
  const { data: todos } = useQuery(trpc.todos.list.queryOptions())

  // Mutation
  const createMutation = useMutation(
    trpc.todos.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      },
    }),
  )

  // SSE Subscription
  React.useEffect(() => {
    const unsubscribe = httpTrpcClient.todos.onUpdate.subscribe(undefined, {
      onData: (data) => {
        queryClient.setQueryData(trpc.todos.list.queryKey(), data.todos)
      },
    })
    return () => unsubscribe.unsubscribe()
  }, [])
}
```

## 🔧 Key Patterns

### 1. drizzle-zod for Schema Generation
Instead of manually defining Zod schemas, use `drizzle-zod` to automatically generate them from your Drizzle tables:
- `createInsertSchema()` - For create operations
- `createUpdateSchema()` - For update operations
- `createSelectSchema()` - For reading/selecting data

### 2. Folder-per-Entity in Service Layer
Each entity has its own folder with individual files for each operation:
```
service/src/
├── queries/
│   └── todos/
│       ├── get-todo.ts
│       ├── get-todos.ts
│       └── index.ts
└── mutations/
    └── todos/
        ├── create-todo.ts
        ├── update-todo.ts
        ├── delete-todo.ts
        └── index.ts
```

### 3. Merged tRPC Routers
Routers are split by concern and merged:
```typescript
export const todosRouter = mergeRouters(todosQueries, todosMutations, todosSubscriptions)
```

### 4. Dual tRPC Clients
- **HTTP Client**: For queries/mutations + SSE subscriptions
- **WebSocket Client**: For real-time WebSocket subscriptions

## 📦 Dependencies

Key packages added:
- `@tanstack/react-query` - Data fetching and caching
- `@trpc/tanstack-react-query` - tRPC + React Query integration
- `@trpc/client` - tRPC client
- `drizzle-zod` - Zod schema generation from Drizzle
- `superjson` - Type-safe serialization

## 🚧 Production Notes

### Replace SSE Polling with Redis Pub/Sub
For production, replace the polling-based subscription with Redis:
```typescript
// Use Redis Pub/Sub or PostgreSQL LISTEN/NOTIFY
for await (const event of createRedisIterable(channel, signal)) {
  yield event
}
```

## 📝 License

MIT

## Made By Netko Labs <3

