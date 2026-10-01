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
- One PostgreSQL database (auth tables + todos + chat); Redis optional (`CACHE_URL`, the room bus).
- Every env variable the studio reads is listed, with its default, in `apps/studio/sample.env`.
- Shared tooling and UI live under `packages/shared/*` (`cli`, `logger`, `ui`, `typescript-config`, `resend-client`, `observability`).

When extending the template with additional apps, colocate app-specific packages under `packages/{app-name}/*` and config under `packages/configs/{app-name}-config`. Keep cross-cutting concerns in `packages/shared/*`.

## Domain

Product invariants, one per bullet: at most 3 lines, naming the symbol or test that enforces it.
Narratives go to `docs/`. The template ships this section empty; a project fills it.

## Backend Layering

The generic layering pattern and per-layer folder structure (`domain → repository → service → trpc →
ui`, plus `lib/`/`shared/` and the `domain` folder vocabulary) live in **Backend Layering** in
`@docs/conventions.md`. This section records only the concrete studio-stack specifics:

- **Auth**: better-auth at `/api/auth` (`routes/api/auth/$.ts`, `service/src/auth/auth.ts`): magic link always; GitHub, Google and Discord each turn on when both their env values are set. Account linking never trusts a provider's unverified email (`service/src/auth/_tests/auth.test.ts`).
- **Router**: `appRouter` is `{ auth, room, todos }` (`trpc/src/index.ts`). `auth.me` is the only public procedure: `PUBLIC` in `trpc/src/_tests/procedures.test.ts`, which calls every other path anonymous and expired.
- **Repository** exports only `db`, `closeDb`, `sql`, `Tx`, `createCacheClient` and `CACHE_URL` (`repository/src/index.ts`). Every query and mutation, trivial reads included, is a service operation that calls drizzle itself.
- **Contracts**: `packages/studio/trpc` does not depend on zod. Every query and mutation declares `.input()` (when it takes one) and `.output()` from domain; subscriptions declare `.input()` only. `procedures.test.ts` fails a query or mutation without an output parser.
- **Domain shapes**: entities are drizzle-zod output only (`createInsertSchema`/`createSelectSchema`, `domain/src/entities/`); hand-written inputs and results live in `domain/src/schemas/{entity}.ts`; client-visible limits and error codes in `domain/src/values/{entity}.ts` (`TODO_ERROR_CODES`).
- **Service errors**: `TodoError extends ServiceError` (`service/src/shared/service-error.ts`). `serviceErrorMiddleware` (`trpc/src/init.ts`) maps one to `NOT_FOUND` (`not_found`) or `PRECONDITION_FAILED`, message = code; the UI turns codes into copy with `toUserMessage` (`apps/studio/src/shared/trpc-error/`).
- **Route data** goes through `src/integrations/{concern}/get-*.ts` server functions (`integrations/auth/get-session.ts` → `getSessionUser`). `/todos` sits under `routes/_authed/`, whose `beforeLoad` redirects to `/sign-in?redirect=…` and returns `{ session }`. No tRPC SSR prefetch (D4 in `docs/decisions.md`).
- **Room**: `service/room` is an integration. `room-hub.ts` (`RoomHub`) runs over the `RoomBus` that `create-room-bus.ts` picks: `local/` in-process, or `redis/` when `CACHE_URL` is set. The bus is a `globalThis` singleton: bus-file edits need a dev restart, hub edits hot-reload. `trpc/routers/room` exposes `send`/`setStatus` (mutations) and `stream` (subscription; history arrives in its `sync`). Shapes and invariants: `docs/room-bus.md`.
- **WebSocket transport**: `packages/studio/trpc/src/ws/` adapts each crossws peer to tRPC's official `getWSConnectionHandler` (stock wire protocol, so `wsLink` works unchanged). `apps/studio/src/server/trpc-ws.ts` wraps it in `defineWebSocketHandler` and `vite.config.ts` mounts it at `/trpc-ws` via the nitro plugin `handlers` option. Never add a second WebSocket entry; extend the router instead.
- **Auth on the socket**: the upgrade request carries the better-auth session cookie; `createContext({ req })` is shared by the fetch adapter and the WebSocket bridge. No JWT hop, no `connectionParams`.
- **HTTP edge**: `routes/api/trpc/$.ts` goes through `createTRPCHttpHandler` (`trpc/src/http/`): JSON-only POSTs, the WebSocket's `isTrustedOrigin` (`trpc/src/shared/origin/`), body and batch caps. Outside dev `formatErrorShape` lets only a service error's code through as a message.
- **Observability** (code-whiskers, every signal off unless its env is set): `@temp-repo/observability` exports `/server` (Sentry errors, OTLP/HTTP JSON traces and logs) and `/client` (browser SDK, lazily imported only when `VITE_SENTRY_DSN` is set at build). `server/plugins/observability.ts` is listed first and registers no `close` hook; `shutdown.ts` flushes last. Errors are captured once: tRPC `onError` (INTERNAL_SERVER_ERROR only, `reportInternalErrors`), the `start.ts` request and function middleware, the router's `defaultOnCatch` (skips answered tRPC errors; a server-function fault that reaches a route boundary still arrives from both sides), and process defaults; browser events go through `/api/monitor`. Logs carry `trace_id`/`span_id` while a span is active (never when telemetry is off). Config is read once in studio-config; the package never reads `process.env` beyond the OTel SDK's standard `OTEL_*` variables. Setup and rules: `docs/observability.md`.
- **Email**: `service/email` is an integration; `send-email.ts` dispatches to `resend/` (over `@temp-repo/resend-client`, built once from `studioEnvConfig.email`) or `console/`, which throws unless `NODE_ENV === 'development'`. Service never reads email env itself.
- **Client**: `src/integrations/trpc/client.ts` builds a `splitLink` — subscriptions over a lazy `wsLink` to the same origin, everything else over `httpBatchLink`. SSR gets HTTP-only links. Components go through the `useTRPC()` options proxy (`queryOptions`/`mutationOptions`); the raw `trpcClient` is only for imperative calls (the room subscription, the status reporter).
- **Composition root**: `apps/*/src/server/**` and `routes/api/**` may import `service` and `repository` for lifecycle (shutdown) and health. UI code never does.
- **Nitro patch**: `patches/nitro@*.patch` (applied by `bun install` via `patchedDependencies`) makes Nitro's Vite dev worker install the crossws Bun plugin. Without it the dev worker loads crossws's Node adapter and every route answers 500 with `[crossws] Using Node.js adapter in an incompatible environment`. The key is the exact nitro version, and a mismatch is dropped silently: `serve` refuses to start and CI fails via `bun run repo check:nitro-patch --app studio`. Upstream: nitrojs/nitro#3939.

## Scaffolding

- **`bun run gen:app`** — Turbo generator in `turbo/generators/config.ts`. Prompts for a name, then creates the app under `apps/{name}` plus layered packages (`domain`, `repository`, `service`, `trpc`) and `packages/configs/{name}-config`.
- **App template** — `turbo/generators/templates/app-tanstack/`. TanStack Start + tRPC over HTTP and WebSocket: `components/core/root/` shell (devtools behind a DEV-only lazy import), `src/server/trpc-ws.ts`, `integrations/trpc/` split client, `trpc/src/ws/` bridge, TanStack Query provider, `@temp-repo/ui` (its `globals.css` and `buttonVariants`; no app-local token sheet), `public/` holding every asset the root route links, Nitro + Vite 8. It mirrors studio's server edge (error masking, D13 middleware, logging policy, `assertProductionEnv`, HTTP/WS limits, security headers), observability (off until env is set), the router error surface and the trpc/config tests. One example runs every layer: a `note` table with its migration, `notes.list` (`.input()`/`.output()` from domain) on the home page, and a `db:seed` fixture. It is **auth-less**: no AUTH_SECRET, `createContext` returns no session, and `protectedProcedure` refuses everyone until auth is ported from `apps/studio`.
- **Reference app** — treat `apps/studio` as the living example when extending a generated app. Root `CLAUDE.md` applies to all apps unless an app adds a local override.
- **`bun run gen:lib`** — two kinds: `library` → `packages/shared/{name}` (re-export-only barrel, `utils.ts` + test); `client` → `packages/shared/{name}-client`, a transport-only external-service client (`templates/shared-client/`). Both generators finish by running `biome check --write` over what they created.

## Commands

- Start a project from this template: the checklist in README (`## Start a project from this canvas`)
- Rename the scope: `bun run rename:preview @scope`, then `bun run rename @scope` (re-copy every
  `apps/*/.env` from its `sample.env` afterwards; rename leaves `.env` untouched)
- Development: `bun run repo dev --app studio` or `bun run dev` (docker up, `db:generate`,
  `db:migrate`, then the dev server on localhost:3000, WebSocket at `/trpc-ws`; with no
  `RESEND_API_KEY` the magic link is logged to this console)
- Web production build: `bun run repo build --app studio`
- Smoke the built server: `bun run repo test:smoke --app studio` (after the build; `_tests/smoke.ts`
  boots `.output` in production mode on :4790 against `DATABASE_URL`/`CACHE_URL` and probes health,
  SSR, tRPC over HTTP and the socket, the origin check and the SIGTERM drain)
- Dev server only (no docker/migrations): `bun run repo serve --app studio`
- Docker up/down: `bun run repo docker:up --app studio` / `bun run repo docker:down --app studio`
- Repo typecheck: `bun run check-types`
- Repo lint and formatting check: `bun run fmt-lint`
- Repo lint and formatting fix: `bun run fmt-lint:fix`
- Repo tests: `bun run test` (bun test via turbo; `repo test` loads `apps/studio/.env`, or the
  `--app` one, under the shell env). Gated suites skip without their env: the Redis bus contract
  needs `CACHE_URL`; todo ownership and OAuth linking need `DATABASE_URL` with migrations applied.
  A run with skips is not a pass for those layers; CI sets `REQUIRE_GATED_SUITES=1` so a skip
  fails. `LOG_LEVEL=silent bun run test` quiets logs; telemetry env is deliberately not passed
  to tests.
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
