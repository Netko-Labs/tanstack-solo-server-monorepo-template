# TanStack Solo Server Monorepo Template

A modern, type-safe full-stack **solo-server** template: one TanStack Start app (`studio`) that serves the UI, better-auth, tRPC over HTTP **and** tRPC over a native **WebSocket** (`/trpc-ws`), wired with Drizzle ORM, TanStack Query, and Bun.

## 🚀 Features

- 🏛️ **Solo server** - one Nitro/Bun process serves SSR, `/api/auth`, `/api/trpc` and the `/trpc-ws` WebSocket
- 🔄 **tRPC** - End-to-end type-safe APIs (`httpBatchLink` for queries/mutations, `wsLink` for subscriptions via `splitLink`)
- 🔌 **WebSocket real-time** - presence + live chat room over crossws (Nitro `experimental.websocket`), same-origin cookie auth
- 🔑 **Magic-link auth** - better-auth magic link + a `/sign-in` page (Resend email, console fallback)
- 📊 **TanStack Query** + 🗃️ **Drizzle ORM** - typed data fetching + `drizzle-zod` schemas; one database
- 📦 **Turborepo** + ⚙️ **Bun** - fast monorepo tooling and runtime
- 🎯 **TypeScript** - Full type safety across the stack

## 📦 What's Included

### Working examples

- ✅ **Todos** — CRUD over tRPC HTTP batching, session-authorized
- ✅ **Presence + live chat** — a WebSocket room: who's-online presence (join/leave) + live messages
- ✅ **Magic-link sign-in** — email → link → session cookie, on a dedicated `/sign-in` page
- ✅ **drizzle-zod** — Zod schemas generated from Drizzle tables
- ✅ **Clean architecture** — `domain → repository → service → trpc → ui`

## 🏗️ Project Structure

```
.
├── apps/
│   └── studio/                 # TanStack Start application
│       └── src/
│           ├── components/     # React components (feature folders + definitions/)
│           ├── integrations/   # TanStack Query + tRPC setup
│           │   ├── tanstack-query/
│           │   └── trpc/       # client.ts: httpBatchLink + wsLink (splitLink)
│           ├── routes/         # File-based routing (thin Route exports)
│           └── server/         # Nitro handlers (trpc-ws.ts → /trpc-ws)
│
├── packages/
│   ├── studio/
│   │   ├── domain/             # Domain layer
│   │   │   ├── db/             # Drizzle schemas
│   │   │   └── entities/       # drizzle-zod generated schemas
│   │   ├── repository/         # Database layer
│   │   ├── service/            # Business logic
│   │   │   ├── queries/        # Query functions (folder per entity)
│   │   │   └── mutations/      # Mutation functions (folder per entity)
│   │   └── trpc/               # tRPC routers
│   │       └── routers/
│   │           └── todos/
│   │               ├── queries.ts
│   │               ├── mutations.ts
│   │               └── subscriptions.ts
│   └── shared/
│       └── ui/                 # Shared UI primitives (shadcn-style)
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) 1.4.0 (the version in `package.json`'s `packageManager`; older Bun lacks the
  Redis client and cannot apply the nitro patch)
- Docker (Postgres and Redis run from `apps/studio/compose.yml`)

### Installation

```bash
bun install
cp apps/studio/sample.env apps/studio/.env   # defaults match the compose services
```

### Development

```bash
# Starts Postgres + Redis, generates and applies migrations, then the dev server
bun run repo dev --app studio
# or: bun run dev

# Server will start at http://localhost:3000 (WebSocket at ws://localhost:3000/trpc-ws)
# Visit http://localhost:3000/chat for presence + live chat, /todos for CRUD
```

## 📖 Architecture Patterns

### Frontend component organization

React components in `apps/studio` follow a consistent structure (see `CLAUDE.md` for full agent rules):

**Module anatomy** — each feature is a module: the public `.tsx` (and nested sub-components) at the root, internals under `lib/`, and an `index.ts` barrel as the module's only public entry:

```
components/todos/todos-example/
  todos-example.tsx             # public component
  todo-list/                    # nested sub-components get their own folders
  lib/
    hooks/
      use-todos-example.ts      # hooks ALWAYS live in a hooks/ subfolder
    types.ts                    # props, hook types, local unions
    values.ts                   # labels, empty-state copy (optional)
    constants.ts                # limits, keys — UPPER_SNAKE_CASE (optional)
    utils.ts                    # pure helpers for this feature (optional)
    index.ts                    # re-exports the lib surface
  index.ts                      # module barrel: export { TodosExample }
```

Import a module through its barrel (`@/components/todos/todos-example`), never its inner files. `lib/` is private to its module.

**Progressive disclosure** — `utils`/`types`/`constants`/`values` start as a single flat file and graduate to a folder (`utils/`) only when the category has many entries or a file exceeds 300 lines. Only `hooks/` is always a subfolder.

**Scope ladder** (narrowest → widest):
- module-internal → the module's `lib/`
- cross-feature reuse within the app → a `shared/` module (`components/shared/*` for UI, `src/shared/*` for logic like `@/shared/dom-events`)
- app-root shells and providers → `components/core/*`
- cross-app primitives → `packages/shared/*`

**Hierarchy** — shallow feature trees, not flat large files: feature → section → element.

```
components/todos/
  todos-example/
  todo-list/
    todo-item/
shared/                         # cross-feature UI within the app
core/                           # app-wide shells and providers
```

**Budgets:**
- `.tsx` and colocated `.ts` files: **≤ 300 lines**
- Hooks per component file: **≤ 3** (extract `lib/hooks/use-*.ts` when exceeded)
- Route files: thin `Route` export only; UI lives under `components/`

**Layer boundaries:**
- UI-only types/constants/values → the module's `lib/` (private to the module)
- Pure helpers → the module's `lib/utils.ts`, or an app `src/shared/*` logic module when reused across features
- Entities, schemas, validation → `packages/studio/domain`

The full, portable rules live in `@docs/conventions.md`.

### Domain Layer (`packages/studio/domain`)

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

### Service Layer (`packages/studio/service`)

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

### tRPC Layer (`packages/studio/trpc`)

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

### Frontend Integration (`apps/studio/src/integrations`)

**tRPC client**:
- `client.ts` - `splitLink`: `httpBatchLink` for queries/mutations, `wsLink` (lazy, same-origin `/trpc-ws`) for subscriptions
- `react.ts` - TanStack Query + tRPC context (`useTRPC`, `TRPCProvider`)

**Usage in Components**:
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trpcClient, useTRPC } from '@/integrations/trpc'

function TodosExample() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: todos } = useQuery(trpc.todos.list.queryOptions())

  const createMutation = useMutation(
    trpc.todos.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      },
    }),
  )

  useEffect(() => {
    const sub = trpcClient.room.stream.subscribe({ roomId: 'lobby' }, {
      onData: (event) => {
        if (event.type === 'chat') queryClient.invalidateQueries({ queryKey: trpc.room.messages.queryKey() })
      },
    })
    return () => sub.unsubscribe()
  }, [queryClient, trpc.room.messages])
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
export const todosRouter = mergeRouters(todosQueries, todosMutations)
```

### 4. tRPC HTTP + WebSocket in one process

- **Client** (`trpcClient`): `splitLink` sends subscriptions over `wsLink` and everything else over `httpBatchLink`. SSR builds HTTP-only links.
- **Server**: `apps/studio/src/server/trpc-ws.ts` is a Nitro handler (`defineWebSocketHandler`) mounted at `/trpc-ws` from `vite.config.ts`. `packages/studio/trpc/src/ws/` adapts each crossws peer to tRPC's official `getWSConnectionHandler`, so the wire protocol is stock tRPC.
- **Auth**: the upgrade request carries the better-auth session cookie; `createContext({ req })` is shared by the fetch and WebSocket paths. The upgrade hook enforces an origin allow-list.
- **Dev under Bun**: `patches/nitro@*.patch` (via `bun patch`) lets Nitro's Vite dev worker install the crossws Bun plugin; without it `vite dev` answers upgrades with 426.

## 📦 Dependencies

Key packages added:
- `@tanstack/react-query` - Data fetching and caching
- `@trpc/tanstack-react-query` - tRPC + React Query integration
- `@trpc/client` - tRPC client
- `drizzle-zod` - Zod schema generation from Drizzle
- `superjson` - Type-safe serialization

## 🚀 Deploy (Coolify + Railpack)

One Coolify application, built from the repo root by [Railpack](https://railpack.com). `apps/studio/railpack.json` holds the build command and a pruned deploy image (bun toolchain + `.output`, no `node_modules`). WebSockets need nothing extra: Coolify's Traefik proxies the `/trpc-ws` upgrade like any HTTP/1.1 request.

In Coolify:

1. **Build Pack** → Railpack. **Base Directory** → `/` (shared workspace monorepo, not the app folder).
2. **Environment Variables** → add `RAILPACK_CONFIG_FILE=apps/studio/railpack.json` with **Build Variable** enabled.
3. **No pre-deployment command.** Coolify runs that inside the *previous* container before the new image
   exists, so it would apply last deploy's migrations. `railpack.json`'s `startCommand` migrates inside the
   new container and only then serves; a failed migration fails the healthcheck and rolls back. Write
   migrations expand/contract: the old container keeps serving during the rollout.
4. **Healthcheck** → `/api/health` on port 3000 (503 when Postgres or Redis is unreachable). The
   runtime image gets `curl` from `railpack.json`'s `deploy.aptPackages`; without it Coolify's probe can
   never pass. **Watch Paths** → `apps/studio/**`, `packages/studio/**`, `packages/configs/studio-config/**`,
   `packages/shared/**`, `patches/**`, `package.json`, `bun.lock`.
5. Runtime variables, all required in production (the app refuses to boot otherwise): `BASE_URL`,
   `DATABASE_URL`, `AUTH_SECRET` (32+ chars), `RESEND_API_KEY`. Recommended: `CACHE_URL` (Redis; without it
   the room bus is in-process, so set it before running more than one instance). Optional:
   `TRUSTED_ORIGINS`, `EMAIL_FROM`, `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`, `LOG_LEVEL`.
6. Graceful shutdown: `railpack.json` clears Railpack's `CI=true` (which disables the server's SIGTERM
   handling) and sets `SERVER_SHUTDOWN_TIMEOUT=10`; keep Coolify's stop grace period above that. On
   SIGTERM every socket closes with 1001, room leaves run, then Redis and Postgres clients close.

What a deploy does:

```
bun install --frozen-lockfile
bun run repo build --app studio                    # .output/ + .output/migrate/
bun apps/studio/.output/migrate/migrate.js \
  && bun apps/studio/.output/server/index.mjs      # start: migrate, then serve HTTP + WebSocket
```

If Coolify's Railpack build ignores `RAILPACK_CONFIG_FILE`, the fallback is the **Build Command** / **Start Command** fields with the same two commands — the app still deploys, but without the pruned image.

Dry-run the plan locally with the [Railpack CLI](https://railpack.com/getting-started):

```bash
railpack plan --config-file apps/studio/railpack.json .
```

## 🚧 Production Notes

### Scaling past one instance
Presence + chat fan out through a `RoomBus` (`packages/studio/service/src/room/`). With `CACHE_URL`
set the Redis implementation is used: events go over a channel per room, presence lives in a hash
plus a per-connection TTL key refreshed by a 15 s heartbeat (gone after 45 s), status is set by the
client from tab visibility, and a Redis restart is survived (subscriptions are restored and every
stream re-syncs). Without `CACHE_URL` the in-process bus is used, which is fine for one instance and
for tests. Chat history is always Postgres. Design and invariants: [`docs/room-bus.md`](docs/room-bus.md).

### Upgrading an existing database
Migration `0003` deletes existing `todo` rows (they had no owner) and drops the `jwks` table. Reset
the database or backfill `todo.user_id` by hand before running it against real data.

### Sockets behind the proxy
The tRPC adapter pings every 30 s so idle-timeouts never close a quiet tab, and the crossws upgrade
hook rejects browser origins outside `BASE_URL` + `TRUSTED_ORIGINS` (cookies ride cross-site
upgrades; CORS does not apply to WebSockets).

## 📝 License

MIT License

Made by Netko Labs with love
