# Handoff: mirror the two-app (studio + realtime WebSocket) architecture into THIS tRPC template

## Goal
This repo (`tanstack-solo-server-monorepo-template`, tRPC, **deployed at Netko-Labs `main`**) should get
the same two-app architecture already **completed + validated** in the sibling Elysia template. Studio
becomes **auth-only**; a new headless **`realtime`** app owns all transactional ops + a **WebSocket**
room (presence + live chat). Use openhotel's tRPC-WS pattern. Two databases. Cross-service JWT/JWKS auth.

## Read these first (references)
- **`../openhotel`** — the EXACT tRPC-WS reference (same monorepo lineage):
  - `apps/realtime/src/index.ts` — Hono + `Bun.serve`; `createBunHonoWSHandler` from
    `@valkyrie-resistance/trpc-ws-hono-bun-adapter`; `export default { port, fetch: app.fetch, websocket }`.
  - `packages/realtime/trpc/src/init.ts` — context from `connectionParams.token` → JWKS verify
    (`jose` `createRemoteJWKSet`/`jwtVerify`, `issuer` = studio baseURL); public/protected/admin procedures.
  - `packages/realtime/trpc/src/routers/room/subscriptions.ts` — `observable`-based presence: subscribe =
    join + emit sync/history, teardown = leave. Emits a discriminated `RoomEvent` union.
  - `packages/realtime/service/src/room/room-hub.ts` — in-memory RoomHub (join/leave/broadcast/snapshot).
  - `packages/hotel/service/src/auth/index.ts` + `.../email/magic-link-email.tsx` — better-auth + magic
    link + `jwt` plugin + Resend email.
  - `apps/hotel/src/integrations/realtime/index.ts` — client: `createWSClient` + `wsLink` (superjson) +
    `connectionParams: async () => ({ token: await ensureRealtimeToken() })` + `lazy: { closeMs }`;
    `ensureRealtimeToken()` fetches `/api/auth/token`.
- **`../tanstack-elysia-monorepo-template`** — the COMPLETED Elysia version (7 commits `38a1498..729e742`).
  Mirror its structure + decisions; its CLAUDE.md "Backend Layering" documents the two-app split. Each
  commit message is a step-by-step guide:
  - `1fd17dc` realtime backend packages + app + **CLI kind-detection** (reuse verbatim).
  - `e10d7c9` studio teardown to auth-only + frontend repoint + presence demo.
  - `940f9a7` magic-link email + `/sign-in` + end-to-end validation approach.
  - `ae0d0b4` generator `studio | realtime` type + `app-realtime` template.
  - `729e742` docs.

## Build order (commit each as an additive milestone — this is the deployed repo)
1. **Realtime backend** — `packages/realtime/{domain,repository,service,trpc}` + `configs/realtime-config`
   + `apps/realtime`:
   - domain: move `todo`+`chat` tables (DROP the `chat_message.author_id → user.id` FK — identity comes
     from the JWT) + drizzle-zod entities + a room event union + realtime config schema.
   - repository: DB #2 drizzle `bun-sql` client + drizzle.config.
   - service: moved todo/chat queries+mutations (repoint imports to realtime-*); RoomHub; `verifyToken`
     (jose JWKS vs studio `/api/auth/jwks`).
   - trpc: `init.ts` (context = `verifyToken(connectionParams.token)`; public/protected procedures,
     superjson transformer + the existing SSE ping config is fine), `routers/{todos,chat}` (transactional),
     `routers/room/subscriptions.ts` (observable presence + chat; subscribe=join, teardown=leave), appRouter.
   - `apps/realtime`: Hono + `Bun.serve` + the trpc-ws adapter; port 3001; per-app `compose.yml`
     (`db-realtime`, 5434); `.env` (PORT, DATABASE_URL, WEB_BASE_URL, CORS). Package name `realtime-app`,
     scope `@temp-repo/realtime-*` (CLI resolves `${scope}/${app}-repository`).
   - **CLI**: add `getAppKind()` + branch `dev/serve/build` for headless server apps — copy from the Elysia
     `1fd17dc` (`packages/shared/cli/src/{utils/apps.ts,commands/dev.ts,commands/build.ts}`).
2. **Studio → auth-only** — remove todo/chat from `packages/studio/{domain,service,trpc}`; studio trpc keeps
   only the `auth` router. Regenerate the studio DB migration (auth-only).
3. **Frontend repoint** — `apps/studio/src/integrations/realtime`: `createWSClient` + `wsLink` +
   `connectionParams` token + `lazy`; `ensureRealtimeToken()` → `/api/auth/token`. Repoint
   `use-todos-example` (realtime trpc query/mutation) + `use-chat-example` (`realtime.room.subscribe` for
   presence + chat) + a members-list presence UI. Domain type imports `studio-domain` → `realtime-domain`.
4. **Magic-link** (already present as console.log) — add `service/email` (HTML template + env-gated Resend)
   + a `/sign-in` route. Mirror Elysia `940f9a7`.
5. **Generator** — add `studio | realtime` type prompt + `templates/app-realtime/*` (tRPC-WS flavor).
   NOTE: this repo's generator still has the **hono** type + `templates/app-hono/` — decide whether to keep
   or drop it (the Elysia repo removed hono).
6. **Docs** — CLAUDE.md + README for the two-app tRPC architecture.

## Key decisions / gotchas
- **tRPC-WS adapter**: openhotel uses `@valkyrie-resistance/trpc-ws-hono-bun-adapter`. VERIFY it's still the
  right/installable choice, or use `@trpc/server/adapters/ws` + `Bun.serve` directly. The client uses
  `wsLink` + `createWSClient` (NOT the SSE `httpSubscriptionLink` the studio app currently has).
- **Auth over WS = `connectionParams`** (tRPC-native — cleaner than the Elysia `?token=` query hack).
- **The tsgo/Elysia-`.ws()` gotcha is Elysia-specific** — tRPC should NOT hit it, so `apps/realtime` can
  likely stay on `tsgo` (verify; if a lib chokes under tsgo, fall back to `tsc` like the Elysia app entry).
- **Keep `superjson`** (this template uses it as the tRPC transformer; the Elysia one dropped it).
- **Two DBs / two compose profiles**: per-app `apps/{name}/compose.yml` (docker:up uses `cwd: appDir`).
- **`jwt` + `magicLink` plugins already exist** in `packages/studio/service/src/auth/index.ts` (so
  `/api/auth/token` + `/api/auth/jwks` already work).

## Verification (mirror the Elysia validation)
- `bun run check-types` + `bun run fmt-lint` green.
- Two DBs up + migrated; run studio :3000 + realtime :3001.
- Magic-link sign-in → session → JWT via `/api/auth/token`.
- WS `room.subscribe` with `connectionParams` token → presence + chat with two clients; reject without token.
- `gen:app` realtime scaffolds a type-checking app.

## State at handoff
- **Elysia repo**: DONE (7 commits, no remote, fully validated).
- **This tRPC repo**: unchanged since the OpenCode-CI commit (`4123397`, already on `origin/main`). Working
  tree clean. Commit additive milestones; push when validated.
