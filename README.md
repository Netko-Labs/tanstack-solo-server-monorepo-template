# TanStack Solo Server Monorepo Template

A type-safe full-stack **solo-server** template: one TanStack Start app (`studio`) that serves the UI,
better-auth, tRPC over HTTP **and** tRPC over a native **WebSocket** (`/trpc-ws`), wired with Drizzle
ORM, TanStack Query, and Bun.

## 🚀 Features

- 🏛️ **Solo server** - one Nitro/Bun process serves SSR, `/api/auth`, `/api/trpc` and the `/trpc-ws` WebSocket
- 🔄 **tRPC** - end-to-end types; `httpBatchLink` for queries/mutations, `wsLink` for subscriptions via `splitLink`
- 🔌 **WebSocket real-time** - presence + live chat over crossws, same-origin cookie auth, Redis fan-out when `CACHE_URL` is set
- 🔑 **Magic-link auth** - better-auth magic link on `/sign-in` (Resend email; console fallback in development only), optional GitHub/Google/Discord
- 🗃️ **Drizzle + PostgreSQL** - `drizzle-zod` entities, contracts in `domain`, one baseline migration
- 🔭 **Observability** - errors, traces and logs to code-whiskers, off until env is set
- 📦 **Turborepo** + ⚙️ **Bun** - monorepo tooling, runtime, tests and a `repo` CLI

Agents and contributors: the house rules are `CLAUDE.md` (topology, commands) and
[`docs/conventions.md`](docs/conventions.md) (layering, modules, commits). Settled choices live in
[`docs/decisions.md`](docs/decisions.md).

## 🧭 Start a project from this canvas

Do these in order: renaming after `.env` exists leaves the old database name in it.

1. `bun run rename:preview @acme`, then `bun run rename @acme` (scope, compose project names,
   `POSTGRES_DB`, `sample.env` URLs).
2. `bun install`, then `bun run fmt-lint:fix` (imports re-sort under the new scope).
3. `cp apps/studio/sample.env apps/studio/.env` and set `AUTH_SECRET` to the output of
   `openssl rand -base64 32`. Every variable the app reads is documented there. If ports 5432/6379 are taken, set
   `STUDIO_DB_PORT`/`STUDIO_REDIS_PORT` and change `DATABASE_URL`/`CACHE_URL` with them.
4. `bun run dev`, open http://localhost:3000/sign-in and sign in: with no `RESEND_API_KEY` the magic
   link is logged to the dev server's console.
5. `bun run check-types && bun run fmt-lint && bun run test` (see `CLAUDE.md` for the gated suites
   and their env).
6. Strip the examples you don't want ([Removing the examples](#-removing-the-examples)). Before the
   first deploy, regenerate one baseline: delete `packages/studio/repository/src/db/drizzle/`, run
   `bun run repo db:generate --app studio`, then `bun run repo reset --app studio` (drops the local
   volumes and migrates fresh). After a deploy, never rewrite shipped migrations.
7. Reset `tasks/todo.md` to its headings. Keep `tasks/lessons.md` and `docs/decisions.md`, minus the
   entries about examples you removed.
8. Optional: `bun run gen:app` for another app (auth-less; port auth from `apps/studio`).
9. Deploy: one Coolify application per app ([Deploy](#-deploy-coolify--railpack)).
10. Observability: create a code-whiskers project and set four env vars
    ([`docs/observability.md`](docs/observability.md)).
11. Copy `docs/templates/tech-spec.md` to `docs/tech-spec.md` and fill §0 (Foundation).

CI runs on Blacksmith runners (`blacksmith-4vcpu-ubuntu-2404`); outside an org with the Blacksmith
app installed, replace that label with `ubuntu-latest` in `.github/workflows/ci.yml`.

## ⚡ Quick start

Prerequisites: [Bun](https://bun.sh/) 1.4.0 (the `packageManager` version; older Bun lacks the Redis
client and cannot apply the nitro patch) and Docker (Postgres and Redis run from
`apps/studio/compose.yml`).

```bash
bun install
cp apps/studio/sample.env apps/studio/.env   # defaults match the compose services
bun run dev                                  # docker up, db:generate, db:migrate, dev server
```

The server listens on http://localhost:3000 (WebSocket at `ws://localhost:3000/trpc-ws`). `/todos`
is the signed-in CRUD example, `/chat` the presence + live chat room. Every command, with what it
does, is in `CLAUDE.md` → Commands and [`packages/shared/cli/README.md`](packages/shared/cli/README.md).
If every dev route answers 500 with `[crossws] Using Node.js adapter in an incompatible environment`,
see `CLAUDE.md` → Nitro patch (`bun run repo check:nitro-patch --app studio`).

## 🏗️ Project structure

```
apps/studio/src/
  components/         feature modules (auth, chat, home, todos, shared, core)
  integrations/       auth (get-session server fn), observability, tanstack-query, trpc (splitLink)
  routes/             thin Route files; _authed/ gates its children; api/{auth,trpc,health,monitor}
  server/             trpc-ws.ts (/trpc-ws) and plugins/{observability,shutdown}.ts
  shared/             app logic modules (dom-events, redirect-path, trpc-error, format-date)
packages/
  studio/domain/      db/ tables, entities/ (drizzle-zod), schemas/, values/, factory/, shared/
  studio/repository/  db client, Tx, migrations, seed; cache client
  studio/service/     queries/ mutations/ values/ by entity; auth, email/, room/ integrations;
                      logger/ (better-auth logger), shared/ (ServiceError)
  studio/trpc/        routers/{auth,room,todos}, init.ts, http/, ws/, shared/
  configs/studio-config/  env read once, production checks
  shared/             cli, logger, ui, observability, resend-client, typescript-config
turbo/generators/     gen:app and gen:lib templates
tests/                smoke test of the built server
```

## 🧩 Where the layers live (the todos example)

Read these files in order to see one feature cross every layer. The rules behind them are in
[`docs/conventions.md`](docs/conventions.md) §3–§5.

| Layer | File | Role |
| --- | --- | --- |
| domain | `packages/studio/domain/src/db/todos.ts` | the `todo` table |
| domain | `packages/studio/domain/src/entities/todos.ts` | drizzle-zod insert/select schemas, refined with limits |
| domain | `packages/studio/domain/src/schemas/todos.ts` | hand-written inputs and the list result |
| domain | `packages/studio/domain/src/values/todos.ts` | limits and `TODO_ERROR_CODES`, shared with the client |
| service | `packages/studio/service/src/queries/todos/get-todos.ts` | a read that calls drizzle, scoped to the owner |
| service | `packages/studio/service/src/mutations/todos/update-todo.ts` | a write that throws `TodoError('not_found')` |
| service | `packages/studio/service/src/mutations/todos/ownership.test.ts` | the ownership where-clause, against Postgres |
| trpc | `packages/studio/trpc/src/routers/todos/mutations.ts` | `.input()`/`.output()` from domain, no zod import |
| trpc | `packages/studio/trpc/src/init.ts` | procedures, logging/span middleware, service-error mapping |
| app | `apps/studio/src/routes/_authed/route.tsx` | the gate: `getSession` server fn, redirect, session in context |
| app | `apps/studio/src/components/todos/todos-example/lib/hooks/use-toggle-todo.ts` | one `mutationOptions` hook per action, list invalidation |
| app | `apps/studio/src/components/todos/todos-example/lib/hooks/use-todos-list.ts` | the list-hook contract: `isError`, error copy, `retry` |

Realtime follows the same order: `domain/src/schemas/room.ts` (the `RoomEvent` union),
`service/src/room/` (hub and bus, [`docs/room-bus.md`](docs/room-bus.md)),
`trpc/src/routers/room/subscriptions.ts` (`room.stream`), and
`apps/studio/src/components/chat/chat-example/lib/hooks/use-room-stream.ts` (the client side).

## 🧹 Removing the examples

Each example spans every layer; remove it as a unit, then run `bun run check-types`, `bun run test`
and `bun run repo db:generate --app studio` (a drop migration, or a fresh baseline before the first
deploy).

**Todos**
- domain: `db/todos.ts`, `entities/todos.ts`, `schemas/todos.ts`, `values/todos.ts` and their
  barrel lines.
- service: `queries/todos/`, `mutations/todos/` (with `TodoError` and `ownership.test.ts`) and
  their barrel lines.
- trpc: `routers/todos/` and the `todos` key in `src/index.ts`; `procedures.test.ts` and
  `shared/error-shape/utils.test.ts` throw `TodoError`, so switch them to `ServiceError`.
- app: `routes/_authed/todos.tsx` (keep `_authed/route.tsx` as the gate for your own pages),
  `components/todos/`, the Todos entry in the home `FEATURE_CARDS` and its code tab.
- `tests/values.ts`: point `protectedQuery` at one of your protected queries.

**Chat (realtime)**
- domain: `db/chat.ts`, `entities/chat.ts`, `schemas/chat.ts`, `schemas/room.ts` (and its test),
  `values/chat.ts`.
- service: `queries/chat/`, `mutations/chat/`, `values/chat/`, and `room/` (hub, bus and their
  tests).
- trpc: `routers/room/` and the `room` key.
- app: `routes/chat.tsx`, `components/chat/`, the Chat card and its code tabs, and the chat mention
  in `components/auth/sign-in-form/lib/values.ts`.
- `server/plugins/shutdown.ts`: drop `hub.drain`/`hub.bus.close()`. The hub and its shutdown wiring
  are realtime infra: keep or remove them as a unit. The `/trpc-ws` bridge (`trpc/src/ws/`) stays for
  any future subscription.
- `tests/values.ts`: drop `guardedStream`/`streamInput` or point them at your own subscription.
- `docs/room-bus.md`, and the room entries in `docs/decisions.md` if they no longer apply.

**Home demo**
- `components/home/` and `routes/index.tsx`'s component. Sign-in does not depend on it
  (`components/auth/` owns the form).

Keep `PUBLIC` in `packages/studio/trpc/src/procedures.test.ts` equal to the procedures you mean to
expose without a session; the test calls every other path anonymous and with an expired session.

## 🚀 Deploy (Coolify + Railpack)

One Coolify application, built from the repo root by [Railpack](https://railpack.com).
`apps/studio/railpack.json` holds the build command and a pruned deploy image (bun toolchain +
`.output`, no `node_modules`). WebSockets need nothing extra: Coolify's Traefik proxies the
`/trpc-ws` upgrade like any HTTP/1.1 request.

In Coolify:

1. **Build Pack** → Railpack. **Base Directory** → `/` (shared workspace monorepo, not the app folder).
2. **Environment Variables** → add `RAILPACK_CONFIG_FILE=apps/studio/railpack.json` with **Build Variable** enabled.
3. **No pre-deployment command.** Coolify runs that inside the *previous* container before the new image
   exists, so it would apply last deploy's migrations. `railpack.json`'s `startCommand` migrates inside the
   new container and only then serves; a failed migration fails the healthcheck and rolls back. Write
   migrations expand/contract: the old container keeps serving during the rollout.
4. **Healthcheck** → `/api/health` on port 3000 (503 when Postgres or Redis is unreachable; it also
   reports `release` and `environment`). The runtime image gets `curl` from `railpack.json`'s
   `deploy.aptPackages`; without it Coolify's probe can never pass. **Watch Paths** → `apps/studio/**`,
   `packages/studio/**`, `packages/configs/studio-config/**`, `packages/shared/**`, `patches/**`,
   `package.json`, `bun.lock`.
5. Runtime variables (the full list, with defaults, is `apps/studio/sample.env`). Required in
   production, or the app refuses to boot: `BASE_URL`, `DATABASE_URL`, `AUTH_SECRET` (32+ characters,
   not a placeholder: `openssl rand -base64 32`), `RESEND_API_KEY`. Recommended: `CACHE_URL` (Redis;
   without it the room bus is in-process, so set it before running more than one instance).
   Optional: `TRUSTED_ORIGINS`, `TRUSTED_PROXIES`, `EMAIL_FROM`, `GITHUB_CLIENT_ID`/`_SECRET`,
   `GOOGLE_CLIENT_ID`/`_SECRET`, `DISCORD_CLIENT_ID`/`_SECRET`, `LOG_LEVEL`, and the observability
   set ([`docs/observability.md`](docs/observability.md); `VITE_SENTRY_DSN` and
   `SENTRY_ENVIRONMENT` are build variables too).
6. Graceful shutdown: `railpack.json` clears Railpack's `CI=true` (which disables the server's SIGTERM
   handling) and sets `SERVER_SHUTDOWN_TIMEOUT=10`; keep Coolify's stop grace period above that. On
   SIGTERM every socket closes with 1001, room leaves run, then Redis and Postgres clients close and
   telemetry flushes (bounded at 2 s).

What a deploy does:

```
bun install --frozen-lockfile
bun run repo build --app studio                    # .output/ + .output/migrate/
bun --no-install apps/studio/.output/migrate/migrate.js \
  && bun --no-install apps/studio/.output/server/index.mjs   # start: migrate, then serve HTTP + WebSocket
```

`--no-install` matters: the runtime image has no `node_modules`, and without it Bun auto-installs
any package a dependency probes for at runtime (with `SENTRY_DSN` set, Sentry's module hooks ask npm
for `hono` on every cold boot).

If Coolify's Railpack build ignores `RAILPACK_CONFIG_FILE`, the fallback is the **Build Command** /
**Start Command** fields with the same two commands — the app still deploys, but without the pruned
image. Dry-run the plan locally with the [Railpack CLI](https://railpack.com/getting-started):
`railpack plan --config-file apps/studio/railpack.json .`. Before deploying, `bun run repo build
--app studio && bun run repo test:smoke --app studio` boots the built server the way Coolify does.

## 🚧 Production notes

### Scaling past one instance
Presence + chat fan out through a `RoomBus` (`packages/studio/service/src/room/`). With `CACHE_URL`
set the Redis implementation is used: events go over a channel per room, presence lives in a hash
plus a per-connection TTL key refreshed by a 15 s heartbeat (gone after 45 s), status is set by the
client from tab visibility, and a Redis restart is survived (subscriptions are restored and every
stream re-syncs). Without `CACHE_URL` the in-process bus is used, which is fine for one instance and
for tests. Chat history is always Postgres. Design and invariants: [`docs/room-bus.md`](docs/room-bus.md).

### Sockets behind the proxy
The tRPC adapter pings every 30 s so idle-timeouts never close a quiet tab, and the crossws upgrade
hook rejects browser origins outside `BASE_URL` + `TRUSTED_ORIGINS` (cookies ride cross-site
upgrades; CORS does not apply to WebSockets).

### Security boundary
Built servers send HSTS, `nosniff`, a strict referrer policy and `frame-ancestors 'none'` on every
route (`routeRules` in `vite.config.ts`). `/api/trpc` takes JSON POSTs only (415 otherwise), refuses
a browser `Origin` outside `BASE_URL` + `TRUSTED_ORIGINS` (403), caps bodies at 1 MiB (413) and
batches at 20 (`MAX_TRPC_BATCH_SIZE` in domain, which the client link splits at); `/trpc-ws` closes
a frame over 1 MiB with 1009. Outside dev an error reaches the client as its code only. Known gaps:
a `script-src` CSP needs a nonce from Start; better-auth rate limits live in memory, per instance
(set `TRUSTED_PROXIES` behind a CDN so they key on the client IP); `room.send` has no per-user
throttle.

## 📝 License

MIT License

Made by Netko Labs with love
