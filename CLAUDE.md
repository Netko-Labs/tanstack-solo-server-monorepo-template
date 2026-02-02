# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Operating Principles

- **Correctness over cleverness**: Prefer boring, readable solutions that are easy to maintain.
- **Smallest change that works**: Minimize blast radius; don't refactor adjacent code unless it meaningfully reduces risk.
- **Leverage existing patterns**: Follow established project conventions before introducing new abstractions.
- **Prove it works**: Validate with tests/build/lint. "Seems right" is not done.
- **Be explicit about uncertainty**: If you cannot verify something, say so and propose the safest next step.

## Commands

```bash
# Development
bun run repo dev --app studio         # Start dev server (localhost:3000)
bun run repo build --app studio       # Build for production
bun run repo serve --app studio       # Serve built app

# Verification (run before marking work complete)
bun run check-types                   # Type check all packages
bun run fmt-lint                      # Check formatting (Biome)
bun run test                          # Run tests (Vitest)
bun run repo test:e2e                 # Run E2E tests

# Database (Drizzle)
bun run repo db:generate --app studio # Generate migrations
bun run repo db:migrate --app studio  # Run migrations
bun run repo db:push --app studio     # Push schema to DB
bun run repo db:seed --app studio     # Seed database

# Docker
bun run repo docker:up --app studio   # Start services
bun run repo docker:down --app studio # Stop services

# Code Generation
bun run gen:app                       # Generate new TanStack app
bun run gen:lib                       # Generate new library package
```

## Architecture

**Turborepo monorepo** using **Bun** as runtime and package manager.

### Package Structure

```
apps/studio/                      # TanStack Start SSR app (React 19)
packages/
  studio/
    domain/                       # Drizzle schemas + drizzle-zod entities
    repository/                   # Database layer (Drizzle ORM + postgres)
    service/                      # Business logic (queries/mutations)
    trpc/                         # tRPC router definitions
  shared/
    cli/                          # Monorepo CLI tool (bun run repo ...)
    logger/                       # Pino-based logger
    typescript-config/            # Shared TSConfig
  configs/studio-config/          # Environment configuration
```

### Data Flow

**Domain** (schemas) → **Repository** (DB access) → **Service** (business logic) → **tRPC** (API) → **Frontend** (React)

### Key Patterns

1. **drizzle-zod**: Auto-generate Zod schemas from Drizzle tables using `createInsertSchema()`, `createUpdateSchema()`, `createSelectSchema()`

2. **Folder-per-Entity in Service Layer**:
   ```
   service/src/queries/todos/get-todo.ts
   service/src/mutations/todos/create-todo.ts
   ```

3. **Merged tRPC Routers**: Split by concern (queries, mutations, subscriptions) then merge:
   ```typescript
   export const todosRouter = mergeRouters(todosQueries, todosMutations, todosSubscriptions)
   ```

4. **Dual tRPC Clients**: HTTP client for queries/mutations + SSE subscriptions, WebSocket client for real-time subscriptions

### Tech Stack

- **Frontend**: React 19, TanStack Router, TanStack Query, tRPC Client, Tailwind CSS, Base UI, Tabler Icons
- **Backend**: TanStack Start (SSR), tRPC Server, Drizzle ORM, PostgreSQL
- **Auth**: better-auth
- **AI**: Vercel AI SDK + Vercel AI Gateway
- **Build**: Vite, Turborepo

## Workflow

### Plan Mode
Enter plan mode for non-trivial tasks (3+ steps, multi-file changes, architectural decisions). Include verification steps in the plan. If new information invalidates the plan: stop, update, then continue.

### Incremental Delivery
- Prefer thin vertical slices over big-bang changes
- Land work in small, verifiable increments: implement → test → verify → expand
- Keep risky changes behind feature flags or safe defaults when feasible

### Verification Before "Done"
Never mark complete without evidence:
- `bun run check-types` passes
- `bun run fmt-lint` passes
- `bun run test` passes (or documented reason why not run)
- Behavior matches acceptance criteria

### Bug Fixing
1. **Reproduce** reliably
2. **Localize** the failure (UI, API, DB, build tooling)
3. **Reduce** to minimal failing case
4. **Fix** root cause (not symptoms)
5. **Guard** with regression coverage
6. **Verify** end-to-end

## Task Management

Use `tasks/` directory for non-trivial work:

- `tasks/todo.md` - Checklist with acceptance criteria, track progress, checkpoint notes
- `tasks/lessons.md` - Capture failure modes and prevention rules after corrections

### Plan Template
```markdown
- [ ] Restate goal + acceptance criteria
- [ ] Locate existing implementation / patterns
- [ ] Design: minimal approach + key decisions
- [ ] Implement smallest safe slice
- [ ] Add/adjust tests
- [ ] Run verification (check-types/fmt-lint/test)
- [ ] Summarize changes + verification story
```

## Communication

- Lead with outcome and impact, reference concrete artifacts (file paths, commands, errors)
- Ask questions only when blocked: one targeted question with a recommended default
- State assumptions if you inferred requirements
- Show verification story: what you ran and the outcome

## Error Recovery

**Stop-the-line rule**: If anything unexpected happens (test failures, build errors, regressions), stop adding features, preserve evidence, return to diagnosis.

**Safe fallbacks**: Prefer "safe default + warning" over partial behavior. Degrade gracefully with actionable errors.

## Code Style

**Biome**: 2-space indent, 100-char width, single quotes (double in JSX), trailing commas

**Path alias**: `@/*` → `./src/*` in apps

**Type safety**: Avoid `any` and ignores. Encode invariants at boundaries.

**Dependencies**: Don't add new deps unless existing stack cannot solve it cleanly.

## Commit Convention

Format: `<emoji> <type>(<scope>?): <subject>`

Types: ✨ feat, 🐛 fix, 📝 docs, 💄 style, ♻️ refactor, ⚡ perf, ✅ test, 🔧 chore, 🏗️ build, 👷 ci, 🔒 security

## Definition of Done

- Behavior matches acceptance criteria
- Verification passes (check-types/fmt-lint/test) or documented reason
- Code follows existing conventions
- Short verification story exists: what changed + how we know it works
