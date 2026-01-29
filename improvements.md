# Improvements Roadmap

This document outlines improvements needed to make `tanstack-solo-server-monorepo-template` feature-complete, consolidating the best features from the deprecated `elysia-monorepo-template`.

---

## Overview

The goal is to deprecate the Elysia-based template in favor of this TanStack Solo Server template while ensuring no features are lost. This template already has a solid foundation with tRPC, but needs enhancements in CI/CD, developer experience, and additional examples.

---

## Completed Items

### Priority 0.2: Rename App from "web" to "studio" ✅ COMPLETED

**Changes made:**
- [x] Renamed `apps/web/` → `apps/studio/`
- [x] Renamed `packages/web/` → `packages/studio/`
- [x] Renamed `packages/configs/web-config/` → `packages/configs/studio-config/`
- [x] Updated all package names (`@temp-repo/web-*` → `@temp-repo/studio-*`)
- [x] Updated all import statements throughout the codebase
- [x] Updated `webEnvConfig` → `studioEnvConfig`
- [x] Updated Docker compose services (`db-web` → `db-studio`, etc.)
- [x] Updated workspace configuration in root `package.json`

### Priority 1.1: GitHub Actions Workflows ✅ COMPLETED

**Files created:**
- [x] `.github/workflows/ci.yml` - Type checking, linting, and tests on PRs
- [x] `.github/workflows/commitlint.yml` - Conventional commit enforcement

### Priority 1.2: Husky Git Hooks ✅ COMPLETED

**Files created:**
- [x] `.husky/pre-commit` - Runs biome lint before commits
- [x] `.husky/commit-msg` - Runs commitlint on commit messages
- [x] `commitlint.config.js` - Commitlint configuration
- [x] Added husky and commitlint dependencies

### Priority 1.5: CLI Overhaul ✅ COMPLETED

**Bug fixes:**
- [x] Fixed hardcoded `@glitch-cove` references in `commands/db.ts`
- [x] Added dynamic scope detection via `utils/scope.ts`
- [x] Fixed `tsconfig.json` extending correct package

**New commands added:**
- [x] `status` - Show monorepo status (docker, ports, apps)
- [x] `info --app` - Show detailed app information
- [x] `db:studio --app` - Open Drizzle Studio GUI
- [x] `clean` - Remove build artifacts and caches
- [x] `reset --app` - Reset app (stop containers, remove volumes, fresh start)
- [x] `logs --app` - View Docker container logs with follow mode
- [x] `test` - Run unit tests with watch/coverage options
- [x] `test:e2e --app` - Run Playwright E2E tests

**Root package.json updated with all scripts:**
- [x] All CLI commands exposed via `bun run <command>`

**Help text updated:**
- [x] Updated `utils/help.ts` with all new commands

### Priority 3.1: Health Check Endpoint ✅ COMPLETED

**Created `apps/studio/src/routes/api/health.ts`:**
- [x] Returns `{ status, timestamp, uptime, environment }`
- [x] Includes database connectivity check
- [x] Dynamic import to avoid startup failures

### Priority 4.1: Turbo Generators ✅ COMPLETED

**Updated generators for studio naming:**
- [x] Updated `turbo/generators/templates/` to use studio convention
- [x] Updated generator config

### Priority 4.2: shadcn/ui Components ✅ COMPLETED

**Components added:**
- [x] Dialog / AlertDialog
- [x] Toast (Sonner)
- [x] Select
- [x] Checkbox
- [x] Tabs

### Vite Server Migration ✅ COMPLETED

**Migrated from custom Bun server to pure Vite:**
- [x] Removed custom `server.ts` and `fix-css-hash.ts`
- [x] Using `bun --bun vite dev`, `bun --bun vite build`, `bun --bun vite preview` commands
- [x] TanStack Start native Vite integration (no Vinxi needed)
- [x] tRPC subscriptions via SSE (Server-Sent Events) - works out of the box
- [x] Simpler architecture - no custom server code needed
- [x] Bun runtime with drizzle-orm/bun-sql for database

### Priority 2.2: SSE Chat Example ✅ COMPLETED

**Files created:**
- [x] `packages/studio/domain/src/db/chat.ts` - Chat message table schema
- [x] `packages/studio/domain/src/entities/chat.ts` - Zod schemas and types
- [x] `packages/studio/service/src/chat/events.ts` - Event emitter for real-time updates
- [x] `packages/studio/service/src/queries/chat/get-messages.ts` - Query to fetch messages
- [x] `packages/studio/service/src/mutations/chat/create-message.ts` - Mutation to create messages
- [x] `packages/studio/trpc/src/routers/chat/` - tRPC router with queries, mutations, subscriptions
- [x] `apps/studio/src/components/chat-example.tsx` - Chat UI component
- [x] `apps/studio/src/routes/chat.tsx` - Route at `/chat`

**Features:**
- [x] Real-time messaging via SSE subscriptions
- [x] Authentication required to send messages (uses `protectedProcedure`)
- [x] Global chat room (no room management complexity)
- [x] Last 100 messages loaded on connect
- [x] Auto-scroll to new messages
- [x] Connection status indicator

### Priority 3.2: Request Logging Middleware ✅ COMPLETED

**TanStack Start middleware (`apps/studio/src/start.ts`):**
- [x] Logs all incoming HTTP requests (method, path, query)
- [x] Logs response status and duration
- [x] Excludes `/api/trpc` routes (handled separately)
- [x] Colorized output in development via Pino pretty
- [x] JSON format in production

**tRPC logging middleware (`packages/studio/trpc/src/init.ts`):**
- [x] Logs all procedure calls (path, type: query/mutation/subscription)
- [x] Logs procedure completion with duration and success status
- [x] Logs procedure errors with error message
- [x] Integrates with existing error formatter for detailed error logging

### Priority 4.3: Improve Demo Page ✅ COMPLETED

**Updated `apps/studio/src/components/component-example.tsx`:**
- [x] Comprehensive demo page at `/` (index route)
- [x] Authentication section with login/logout using Better Auth
- [x] Links to interactive examples (Todos, Chat)
- [x] Tech stack overview (TanStack Start, tRPC, Better Auth)
- [x] Code snippets with tabs (tRPC Router, React Query, SSE Subscriptions)
- [x] UI component showcase (Buttons, Badges, Inputs)

**Added auth client integration:**
- [x] `apps/studio/src/integrations/auth/client.ts` - Better Auth React client
- [x] Added `better-auth` dependency to app package.json

---

## Remaining Items

All planned improvements have been completed!

---

## CLI Commands Summary

| Command | Description |
|---------|-------------|
| `bun run dev` | Full dev environment (docker + db + server) |
| `bun run serve` | Dev server only |
| `bun run build` | Production build |
| `bun run docker:up` | Start Docker containers |
| `bun run docker:down` | Stop Docker containers |
| `bun run db:migrate` | Run database migrations |
| `bun run db:generate` | Generate migrations from schema |
| `bun run db:seed` | Seed database |
| `bun run db:push` | Push schema changes directly |
| `bun run db:studio` | Open Drizzle Studio GUI |
| `bun run status` | Show monorepo status |
| `bun run info` | Show detailed app info |
| `bun run logs` | View Docker logs |
| `bun run clean` | Remove build artifacts |
| `bun run reset` | Reset app (fresh start) |
| `bun run test` | Run unit tests |
| `bun run test:e2e` | Run Playwright E2E tests |
| `bun run gen:app` | Create new app |
| `bun run gen:lib` | Create shared library |
| `bun run rename` | Rename project scope |
| `bun run rename:preview` | Preview rename changes |

---

## Package Structure

```
tanstack-solo-server-monorepo-template/
├── apps/
│   └── studio/                    # Main application (renamed from web)
├── packages/
│   ├── configs/
│   │   └── studio-config/         # Environment configuration
│   ├── shared/
│   │   ├── cli/                   # Monorepo CLI
│   │   ├── logger/                # Logging utilities
│   │   └── typescript-config/     # Shared TypeScript config
│   └── studio/
│       ├── domain/                # Domain models and schemas
│       ├── repository/            # Database access layer
│       ├── service/               # Business logic layer
│       └── trpc/                  # tRPC routers
├── turbo/
│   └── generators/                # Turbo generators
├── .github/
│   └── workflows/                 # CI/CD workflows
└── .husky/                        # Git hooks
```

---

## Success Criteria

The migration is complete when:

1. ✅ App renamed from "web" to "studio"
2. ✅ GitHub Actions CI passes on all PRs
3. ✅ Git hooks enforce code quality
4. ✅ CLI provides comprehensive tooling
5. ✅ Real-time subscriptions work with SSE
6. ✅ Health check endpoint is available
7. ✅ Core UI components are available
8. ✅ Demo page showcases all features

---

## Notes

- The custom Bun server approach was kept instead of Nitro for better WebSocket support
- tRPC provides better type safety than Eden Treaty
- SSR capabilities are mature in TanStack Start
- The layered architecture pattern is preserved
- "studio" naming is more descriptive than generic "web"
