# CLAUDE.md

This file applies to the whole repository unless a deeper `CLAUDE.md` overrides it.

## Conventions

Portable code-style and folder-structure rules live in a reusable file imported here:

@docs/conventions.md

That file covers **Vocabulary**, **Modules & Scope** (the `lib/` + `shared/` model), **Backend
Layering**, **Component Authoring**, **State & Wiring**, **Code Style**, and **Workflow** (working
principles, task management, and the commit convention). The sections below stay in this file because
they describe this repo's specific topology, scaffolding, and commands.

## Repository Overview

- Runtime and package manager: `bun@1.2.23`
- Monorepo tooling: Turborepo
- Two apps (openhotel-shaped):
  - `apps/studio` — TanStack Start (React 19, Tailwind, Base UI, Tabler Icons) frontend + an **auth-only** tRPC/better-auth backend (magic link + jwt/jwks). The frontend + identity provider.
  - `apps/realtime` — a **headless** Hono + Bun server that owns all transactional operations **and** the presence/live-chat room, all as tRPC over a single **WebSocket** (`/trpc-ws`). Verifies studio JWTs via JWKS — no shared secret.
- Studio packages: `packages/studio/{domain,repository,service,trpc}` (auth only) + `packages/configs/studio-config`.
- Realtime packages: `packages/realtime/{domain,repository,service,trpc}` + `packages/configs/realtime-config`.
- Two databases: studio (auth tables) and realtime (business/realtime data).
- Shared tooling and UI live under `packages/shared/*` (`cli`, `logger`, `ui`, `typescript-config`).

When extending the template with additional apps, colocate app-specific packages under `packages/{app-name}/*` and config under `packages/configs/{app-name}-config`. Keep cross-cutting concerns in `packages/shared/*`.

## Backend Layering

The generic layering pattern and per-layer folder structure (`domain → repository → service → trpc →
ui`, plus `lib/`/`shared/` and the `domain` folder vocabulary) live in **Backend Layering** in
`@docs/conventions.md`. This section records only the concrete studio-stack specifics:

- `apps/studio` backend is **auth only**: better-auth is mounted at `/api/auth` (magic link + `jwt`/`jwks`); the studio tRPC `appRouter` is just `{ auth }`. All transactional data + logic lives on the realtime server. Put `drizzle-zod` entities in the relevant `domain` package (`createInsertSchema()`/`createUpdateSchema()`/`createSelectSchema()`).
- `apps/realtime` is a **standalone** Hono + Bun server (`@valkyrie-resistance/trpc-ws-hono-bun-adapter`) exposing its tRPC `appRouter` over a single WebSocket at `/trpc-ws`. `packages/realtime/{domain,repository,service,trpc}` hold the tables/entities + a `RoomEvent` union, the DB client, business logic + an in-memory `RoomHub`, and the router (todos + a room presence/chat subscription via an async-generator).
- **Cross-service auth**: studio mints a JWT (`GET /api/auth/token`); the realtime tRPC context reads it from the WS `connectionParams.token` and verifies it against studio's JWKS (`/api/auth/jwks`) with `jose` — no shared secret. The frontend uses one `wsLink` + `createWSClient` realtime client (`src/integrations/realtime`).

## Scaffolding

- **`bun run gen:app`** — Turbo generator in `turbo/generators/config.ts`. Prompts for a name and a **type** (`studio` | `realtime`), then creates the app under `apps/{name}` plus layered packages (`domain`, `repository`, `service`, `trpc`) and `packages/configs/{name}-config`.
- **Studio template** — `turbo/generators/templates/app-tanstack/`. TanStack Start + tRPC HTTP API: `components/core/root/` shell, tRPC client under `src/integrations/trpc/`, TanStack Query provider, `@temp-repo/ui`, Nitro + rolldown-vite.
- **Realtime template** — `turbo/generators/templates/app-realtime/`. A headless Hono + Bun tRPC-WebSocket server (presence + chat room) with JWKS auth; mirrors `apps/realtime`.
- **Reference app** — treat `apps/studio` as the living example when extending a generated app. Root `CLAUDE.md` applies to all apps unless an app adds a local override.
- **`bun run gen:lib`** — shared library under `packages/shared/{name}`.

## Commands

- Studio (frontend + auth) development: `bun run repo dev --app studio` (localhost:3000)
- Realtime (WebSocket server) development: `bun run repo dev --app realtime` (localhost:3001)
- Web production build: `bun run repo build --app studio`
- Web preview: `bun run repo serve --app studio`
- Docker up/down: `bun run repo docker:up --app studio` / `bun run repo docker:down --app studio`
- Repo typecheck: `bun run check-types`
- Repo lint and formatting check: `bun run fmt-lint`
- Repo lint and formatting fix: `bun run fmt-lint:fix`
- Repo tests: `bun run test`
- End-to-end tests: `bun run repo test:e2e`
- Generate app: `bun run gen:app`
- Generate library: `bun run gen:lib`
- Studio DB generate: `bun run repo db:generate --app studio`
- Studio DB migrate: `bun run repo db:migrate --app studio`
- Studio DB push: `bun run repo db:push --app studio`
- Studio DB seed: `bun run repo db:seed --app studio`

## Verification

- Start with the smallest relevant check for the code you changed, then broaden as needed.
- Before handing work off, run the relevant subset of:
  - `bun run check-types`
  - `bun run fmt-lint`
  - `bun run test`
- If database code changes, run the appropriate `db:*` command or explain why it was not run.
- If you cannot run a command, document the reason and note the remaining risk.

## Handoff Notes

- Reference concrete files and commands when summarizing work.
- Call out any follow-up steps needed when contracts or shared packages change.
- If asked to commit, follow the **Commit Convention** in `@docs/conventions.md`.
