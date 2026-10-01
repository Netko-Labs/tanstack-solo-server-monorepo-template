# CLAUDE.md

This file applies to the whole repository unless a deeper `CLAUDE.md` overrides it.

## Conventions

Portable code-style and folder-structure rules live in a reusable file imported here:

@docs/conventions.md

That file covers **Vocabulary**, **Modules & Scope** (the `lib/` + `shared/` model), **Backend
Layering**, **Component Authoring**, **State & Wiring**, **Code Style**, **Workflow** (working
principles, task management, and the commit convention), and **Testing**. The sections below stay in
this file because they describe this repo's specific topology, scaffolding, and commands.

Settled decisions, with what was considered and not used, live in `docs/decisions.md`. Read it
before proposing a change in an area it covers.

## Repository Overview

- Runtime and package manager: `bun@1.4.0` (`packageManager` in package.json; CI installs that version)
- Monorepo tooling: Turborepo
- One app, `apps/studio` — TanStack Start (React 19, Tailwind, Base UI, Tabler Icons) on Nitro/Bun. The same process serves SSR, better-auth (`/api/auth`), tRPC over HTTP (`/api/trpc`) **and** tRPC over a native **WebSocket** (`/trpc-ws`, crossws via Nitro `experimental.websocket`).
- Packages: `packages/studio/{domain,repository,service,trpc}` + `packages/configs/studio-config`.
- One PostgreSQL database (auth tables + todos + chat).
- Shared tooling and UI live under `packages/shared/*` (`cli`, `logger`, `ui`, `typescript-config`).

When extending the template with additional apps, colocate app-specific packages under `packages/{app-name}/*` and config under `packages/configs/{app-name}-config`. Keep cross-cutting concerns in `packages/shared/*`.

## Backend Layering

The generic layering pattern and per-layer folder structure (`domain → repository → service → trpc →
ui`, plus `lib/`/`shared/` and the `domain` folder vocabulary) live in **Backend Layering** in
`@docs/conventions.md`. This section records only the concrete studio-stack specifics:

- better-auth is mounted at `/api/auth` (magic link; optional OAuth providers via env). The tRPC `appRouter` is `{ auth, room, todos }`. `drizzle-zod` entities live in `domain` (`createInsertSchema()`/`createUpdateSchema()`/`createSelectSchema()`); `domain/schemas/room.ts` holds `Member` + the `RoomEvent` union; `service/room` is the `RoomHub` over a `RoomBus` (in-process, or Redis pub/sub when `CACHE_URL` is set; invariants in `docs/room-bus.md`; the bus is a `globalThis` singleton, so bus-file edits need a dev restart; hub edits hot-reload); `trpc/routers/room` exposes `messages`/`send`/`stream` (async-generator subscription).
- **WebSocket transport**: `packages/studio/trpc/src/ws/` adapts each crossws peer to tRPC's official `getWSConnectionHandler` (stock wire protocol, so `wsLink` works unchanged). `apps/studio/src/server/trpc-ws.ts` wraps it in `defineWebSocketHandler` and `vite.config.ts` mounts it at `/trpc-ws` via the nitro plugin `handlers` option. Never add a second WebSocket entry; extend the router instead.
- **Auth on the socket**: the upgrade request carries the better-auth session cookie; `createContext({ req })` is shared by the fetch adapter and the WebSocket bridge. No JWT hop, no `connectionParams`.
- **Client**: `src/integrations/trpc/client.ts` builds a `splitLink` — subscriptions over a lazy `wsLink` to the same origin, everything else over `httpBatchLink`. SSR gets HTTP-only links.
- **Composition root**: `apps/*/src/server/**` and `routes/api/**` may import `service` and `repository` for lifecycle (shutdown) and health. UI code never does.
- **Nitro patch**: `patches/nitro@*.patch` (applied by `bun install` via `patchedDependencies`) makes Nitro's Vite dev worker install the crossws Bun plugin. Without it `vite dev` under Bun answers upgrades with 426. Re-check it when bumping `nitro`.

## Scaffolding

- **`bun run gen:app`** — Turbo generator in `turbo/generators/config.ts`. Prompts for a name, then creates the app under `apps/{name}` plus layered packages (`domain`, `repository`, `service`, `trpc`) and `packages/configs/{name}-config`.
- **App template** — `turbo/generators/templates/app-tanstack/`. TanStack Start + tRPC over HTTP and WebSocket: `components/core/root/` shell (devtools behind a DEV-only lazy import), `src/server/trpc-ws.ts`, `integrations/trpc/` split client, `trpc/src/ws/` bridge, TanStack Query provider, `@temp-repo/ui`, Nitro + rolldown-vite.
- **Reference app** — treat `apps/studio` as the living example when extending a generated app. Root `CLAUDE.md` applies to all apps unless an app adds a local override.
- **`bun run gen:lib`** — shared library under `packages/shared/{name}`.

## Commands

- Development: `bun run repo dev --app studio` (localhost:3000, WebSocket at `/trpc-ws`)
- Web production build: `bun run repo build --app studio`
- Dev server only (no docker/migrations): `bun run repo serve --app studio`
- Docker up/down: `bun run repo docker:up --app studio` / `bun run repo docker:down --app studio`
- Repo typecheck: `bun run check-types`
- Repo lint and formatting check: `bun run fmt-lint`
- Repo lint and formatting fix: `bun run fmt-lint:fix`
- Repo tests: `bun run test` (bun test via turbo). Two suites skip without their env: the Redis bus contract tests need `CACHE_URL`; the todo ownership test needs `DATABASE_URL` with migrations applied
- Generate app: `bun run gen:app`
- Generate library: `bun run gen:lib`
- Studio DB generate: `bun run repo db:generate --app studio`
- Studio DB migrate: `bun run repo db:migrate --app studio`
- Studio DB push: `bun run repo db:push --app studio`
- Studio DB seed: `bun run repo db:seed --app studio` (re-runnable stub in `repository/src/db/seed.ts`; refuses in production)

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
- Commit freely at logical checkpoints, following the **Commit Convention** in
  `@docs/conventions.md`. Push or open a PR only when asked; never commit directly to main in
  multi-branch repos — branch first.
