# Decisions

Settled choices for this template, newest first. Read the matching entry before proposing a change
in its area. A new choice gets a new entry; a reversal marks the old one superseded and links the
new one. Each entry: context, decision, consequence, what was considered and not used, and when to
revisit.

## Open

| Question | Default if unanswered | Needed by |
| --- | --- | --- |
| Hydrate a tRPC query cache during SSR (`unstable_localLink` + `@tanstack/react-router-ssr-query`)? | No. Route data goes through server functions (see *Route data through server functions*). | The first page whose loader must prime the same data a tRPC query then owns. |
| Portless dev hosts (`{app}.{project}.localhost`, generator-registered, HMR behind the proxy)? | Fixed `PORT` per app from its `.env`. | Before a second app or a second project from this template runs side by side. |

## The `lib/` convention is fixed

2026-10-01 · freeze pass

- **Context:** the audit proposed letting a context's descendant modules import its `lib/`.
- **Decision:** `docs/conventions.md` §2 stays as written across the Netko family. New layer
  folders (service `utils/`, `values/`, `logger/`) are §3 layer-specific folders, never a change
  to `lib/`.
- **Consequence:** refactors never rename, remove or repurpose a `lib/` folder; existing imports
  of a parent's `lib/` stay as they are.
- **Considered and not used:** loosening §2 so descendants may import a parent's `lib/` barrel.
- **Revisit when:** Juan reopens it. A refactor never does.

## Repository holds db access primitives; service owns every query

2026-10-01 · freeze pass (D1)

- **Context:** §3 said all database IO lives in `repository`, while every service op ran drizzle
  directly, as the Elysia sibling, code-whiskers and graphya all do.
- **Decision:** `repository` owns how to reach the database: client, `Tx` type, migrations,
  optional seed, cache client and pub/sub primitives. Every query and mutation, trivial reads
  included, is a service op that calls drizzle. Composites import granular ops and wrap one
  `db.transaction`; side effects run after it resolves.
- **Consequence:** `repository/src/files/` goes. Reuse means importing another service op.
- **Considered and not used:** per-table query functions in `repository` (diverges from the
  family); the hybrid "move to repository when reused" (two homes for one thing).
- **Revisit when:** something outside `service` (a worker, a script) needs named queries and
  cannot depend on `service`.

## Every query and mutation declares `.input()` and `.output()` from domain

2026-10-01 · freeze pass (D2)

- **Context:** routers held inline `z.object` inputs with limits duplicated in the UI, and nothing
  checked what a procedure returned.
- **Decision:** both schemas come from `domain`; the `trpc` package does not depend on zod.
  Subscriptions declare `.input()` only: tRPC 11.19's output middleware parses the whole async
  iterable, so their events are typed and parsed in service. Service ops return `T | null`
  (`row ?? null`) so nullable outputs validate.
- **Consequence:** `procedures.test.ts` asserts an output parser on every query and mutation.
- **Considered and not used:** code-whiskers' carve-out (inline router inputs, shared limits from
  domain); declaring inputs only.
- **Revisit when:** tRPC validates subscription output per yielded value.

## Service errors carry a code; one middleware maps them

2026-10-01 · freeze pass (D13)

- **Context:** raw server text reached the UI, and graphya copies a `guarded` wrapper into every
  router.
- **Decision:** an `{Entity}Error` with a `code` lives in service next to its operations; the code
  list is an `as const` array in `domain/values/{entity}.ts`. One middleware on the base procedure,
  after logging, maps it to `TRPCError` (`not_found` → `NOT_FOUND`, otherwise
  `PRECONDITION_FAILED`) with `message = code`. The UI maps codes to copy with a generic fallback.
- **Consequence:** error masking lets only these codes through as messages.
- **Considered and not used:** graphya's TS union of codes in service (the client cannot see it);
  per-router `guarded` wrappers.
- **Revisit when:** an error must carry structured data beyond its code.

## One concept per file

2026-10-01 · freeze pass (D14)

- **Context:** graphya states "one export per file" and breaks it in 28 files.
- **Decision:** one concept per file: one operation, one value group, one error with its codes.
  Files under `queries/` and `mutations/` export exactly one operation. Grab-bag modules are split
  by concept.
- **Consequence:** `CHAT_HISTORY_LIMIT` moves to `service/values/chat/chat-history-limit.ts`; `room/`
  is an integration and keeps its grouped files.
- **Considered and not used:** the literal one-export rule.
- **Revisit when:** a grouped file passes 300 lines.

## Integrations invert; external services get transport-only clients

2026-10-01 · freeze pass (NEW-1, WP21)

- **Context:** the service read `process.env` and called Resend inline; the room bus providers sat
  beside the hub with no dispatcher.
- **Decision:** provider folders under the generality with a dispatcher at its root
  (`email/{resend,console}/`, `room/{local,redis}/`). Each external service gets a
  `packages/shared/{service}-client`: config in as arguments, SDKs inside, no app config, database
  or logger. Service builds each client once from app config.
- **Consequence:** the console email provider keeps the template's guard: it throws unless
  `NODE_ENV === 'development'`.
- **Considered and not used:** graphya's console fallback, which logs magic-link HTML in any
  environment; SDKs as service dependencies.
- **Revisit when:** a provider needs state the dispatcher cannot pass in.

## Authorization: procedure builders and where-clauses, no RLS

2026-10-01 · freeze pass

- **Context:** the only authorization today is `protectedProcedure` plus ownership in the todos
  queries.
- **Decision:** role or permission gates are parameterized builders in `trpc/shared/{concern}.ts`
  that add the actor to `ctx`; the predicate lives in `domain/shared/`. Row ownership is a
  where-clause in every service query, covered by a test (`ownership.test.ts`).
- **Consequence:** the database role sees every row; service is the only gate.
- **Considered and not used:** Postgres RLS keyed on a per-request transaction setting.
- **Revisit when:** a second writer reaches the tables without going through service, or tenants
  share a database.

## Route data through server functions

2026-10-01 · freeze pass (D4)

- **Context:** router context carried a `trpc` client and the query client had dehydrate/hydrate
  config that nothing read.
- **Decision:** remove both. Route data goes through `integrations/{concern}/get-*.ts`, which
  exports one `createServerFn({ method: 'GET' })` that calls a service query with the request
  headers and returns a domain type, consumed in `beforeLoad` or `loader`.
- **Consequence:** no tRPC cache is primed on the server.
- **Considered and not used:** wiring `unstable_localLink` + `@tanstack/react-router-ssr-query`
  now (new dependency, cookie forwarding); see Open.
- **Revisit when:** the Open question above is answered.

## `/todos` is gated by a layout route; `/chat` stays public

2026-10-01 · freeze pass (D5)

- **Context:** gated pages flashed guest content while the client session loaded.
- **Decision:** `routes/_authed/route.tsx` runs `beforeLoad` → `getSession` server fn (a service
  query returning a domain `SessionUser`) → redirect with a same-origin `?redirect=` path, and
  returns the session as context. `/chat` stays public and shows its guest notice on purpose.
- **Consequence:** the guard runs uncached: one server round trip per guarded navigation.
- **Considered and not used:** gating `/chat` too; a client-only `useRequireSession` tri-state
  (code-whiskers); a cached `getSession`.
- **Revisit when:** guarded navigation latency is noticeable, or a second gated area appears.

## Mutations write back from `.output()`, no optimistic updates

2026-10-01 · freeze pass (D11)

- **Context:** the todos example ran every action through one command mutation.
- **Decision:** one `mutationOptions` hook per action. `onSuccess` invalidates the list, or uses
  `setQueryData` when the output is the whole list. Forms clear only in `onSuccess`. Per-row busy
  state comes from `useMutationState` filtered by the mutation key.
- **Consequence:** concurrent rows stay correct; every change waits one round trip.
- **Considered and not used:** optimism via mutation variables; cache-level
  `onMutate`/rollback. Both stay documented as upgrades.
- **Revisit when:** an interaction where the round trip is visible to users.

## One baseline migration

2026-10-01 · freeze pass (D3)

- **Context:** migrations 0000–0004 carried destructive steps (0003 deletes unowned todos, 0004
  drops `passkey`) that a clone has no reason to inherit.
- **Decision:** squash them into one baseline before the freeze.
- **Consequence:** a database already migrated from this template needs its
  `__drizzle_migrations` rows reset once.
- **Considered and not used:** keeping the history with upgrade notes and a baseline-on-clone step.
- **Revisit when:** never for the template; clones own their history from the baseline.

## `db:seed` is a stub that refuses production

2026-10-01 · freeze pass (D9)

- **Context:** `db:seed` was referenced in five places after its removal began, with no seed file.
- **Decision:** restore the CLI command and the repository `db:seed` script; `seed.ts` (and its
  template) refuses when `NODE_ENV === 'production'` and ships an empty body. Contract:
  re-runnable, deletes and re-inserts only its own rows.
- **Consequence:** every reference resolves; local data stays opt-in.
- **Considered and not used:** finishing the removal; a tenant-scoped seed (graphya).
- **Revisit when:** the examples need fixture data to demo.

## `TRUSTED_PROXIES` is an opt-in env

2026-10-01 · freeze pass (D10). Supersedes "trustedProxies deferred" (option name unverified).

- **Context:** behind a CDN every visitor arrives from the proxy's IP, so better-auth's per-IP
  rate limit becomes one shared magic-link bucket for the whole site. The option
  (`advanced.ipAddress.trustedProxies`) is verified in `@better-auth/core`.
- **Decision:** `TRUSTED_PROXIES` wires to it; unset keeps today's behavior. `rateLimit.enabled`
  follows the build-time app mode (`!app.dev`), not better-auth's runtime `NODE_ENV` read.
- **Consequence:** a deploy behind a proxy sets it explicitly. Limits stay in memory, per
  instance.
- **Considered and not used:** keeping it deferred and only documenting the shared bucket.
- **Revisit when:** the proxy chain changes.

## Browser errors go through the app's own tunnel

2026-10-01 · freeze pass (D12)

- **Context:** browser errors need a path to the error collector.
- **Decision:** the browser posts to `/api/monitor`, which forwards with a DSN allow-list and a
  body cap.
- **Consequence:** `connect-src 'self'` holds, ad-blockers do not drop reports, and 429/413 stay
  readable.
- **Considered and not used:** posting directly to the collector's host.
- **Revisit when:** the collector serves a first-party domain.

## `gen:app` scaffolds stay auth-less

2026-10-01 · freeze pass (D6)

- **Context:** the scaffold mentioned `/api/auth` and `AUTH_SECRET` without shipping auth.
- **Decision:** the scaffold is honestly auth-less; `apps/studio` is the auth reference to port.
- **Consequence:** porting auth is a deliberate step per app.
- **Considered and not used:** porting the magic-link stack into the template.
- **Revisit when:** most new apps port auth on day one.

## `AGENTS.md` points at `CLAUDE.md`

2026-10-01 · freeze pass (D8)

- **Context:** turbo writes and re-adds a managed block in `AGENTS.md` when it detects an agent.
- **Decision:** one pointer line to `CLAUDE.md` above the managed block.
- **Consequence:** Codex and Cursor agents reach the house rules; turbo keeps content outside its
  block.
- **Considered and not used:** `agentGuidance: false` and deleting the file (graphya deleted it
  without the flag, so turbo can re-add it).
- **Revisit when:** turbo changes how it manages the block.

## Presence status is client-driven, per connection

2026-09-30 · #15

- **Context:** the server inferred idle from heartbeat age and overwrote what the client knew.
- **Decision:** the client reports status through `room.setStatus` (visible → active, hidden →
  idle) for its own connection; readers collapse a user's connections, and `active` wins.
- **Consequence:** a hidden tab never idles a visible one; heartbeat keeps the stored status.
- **Considered and not used:** server-side idle inference.
- **Revisit when:** a client cannot report visibility (headless consumers).

## Migrate in the start command, not Coolify's pre-deployment command

2026-09-30 · #16

- **Context:** Coolify runs the pre-deployment command in the previous container, before the new
  image exists, so it applies the last deploy's migrations.
- **Decision:** `railpack.json`'s `startCommand` runs the bundled migrator, then the server. A
  failed migration fails the healthcheck and the deploy rolls back.
- **Consequence:** migrations are written expand/contract; the old container serves during the
  rollout.
- **Considered and not used:** Coolify's pre-deployment command.
- **Revisit when:** Coolify runs pre-deployment commands in the new image.

## Authors are shown by display name, never email

2026-09-30 · #16

- **Context:** the public `room.messages` returned every author's email.
- **Decision:** `room.messages` is removed (history arrives in the stream's `sync`), and authors
  are `displayName(user)`: the name, else the email's local part.
- **Consequence:** no procedure returns another user's email.
- **Considered and not used:** keeping `room.messages` behind auth.
- **Revisit when:** users get explicit handles.

## Room ids and subscriptions are bounded

2026-09-30 · #16

- **Context:** client-chosen room ids become Redis keys and channels.
- **Decision:** `RoomIdSchema` is `^[a-z0-9-]{1,64}$`; a peer holds at most 16 subscriptions;
  member hashes expire.
- **Consequence:** a client cannot create unbounded keys or streams.
- **Considered and not used:** none recorded.
- **Revisit when:** rooms need user-facing names (keep the id, add a title).

## RoomBus: in-process, or Redis when `CACHE_URL` is set

2026-09-30 · #14, #15

- **Context:** chat and presence must reach every instance once there is more than one.
- **Decision:** `LocalRoomBus` by default; `CACHE_URL` selects `RedisRoomBus` on Bun's native
  `RedisClient` (no new dependency). The bus is a `globalThis` singleton and restores its own
  `SUBSCRIBE`s after a reconnect; the hub is stateless. Invariants in `docs/room-bus.md`.
- **Consequence:** bus-file edits need a dev restart; hub edits hot-reload.
- **Considered and not used:** Redis as a hard requirement; the 100 ms polling loop it replaced.
- **Revisit when:** presence or chat needs durability beyond pub/sub.

## Magic link is the default provider; OAuth is optional

2026-09-30 · #14, #16

- **Context:** config demanded an OAuth provider, so dummy `GITHUB_*` keys existed only to pass
  validation.
- **Decision:** magic link is the provider; OAuth providers turn on when their env is set. The
  link prints to the console only when `NODE_ENV === 'development'`; elsewhere a missing email
  provider throws.
- **Consequence:** production needs `RESEND_API_KEY` to boot.
- **Considered and not used:** requiring one social provider.
- **Revisit when:** a product needs passkeys or passwords (the `passkey` table was dropped).

## Cookie auth on the WebSocket upgrade, no JWT hop

2026-09-29 · #13, #14, #16

- **Context:** with one process, the upgrade request already carries the better-auth cookie.
- **Decision:** `createContext({ req })` is shared by the fetch adapter and the WebSocket bridge.
  The upgrade checks `Origin` against `BASE_URL` + `TRUSTED_ORIGINS` (403 otherwise). The socket
  closes when the user changes, `protectedProcedure` checks session expiry per call, and streams
  end at expiry.
- **Consequence:** no `connectionParams`, no JWT plugin, no JWKS table, no `jose`.
- **Considered and not used:** JWTs verified via JWKS (the two-app shape).
- **Revisit when:** sockets are served from another origin or process.

## tRPC over a native WebSocket through `getWSConnectionHandler`

2026-09-29 · #13

- **Context:** subscriptions need a socket inside the same Nitro/Bun process.
- **Decision:** `trpc/src/ws/` adapts each crossws peer to tRPC's official
  `getWSConnectionHandler`, mounted once at `/trpc-ws`. The client's `splitLink` sends
  subscriptions over a lazy `wsLink` and everything else over HTTP.
- **Consequence:** the stock wire protocol and `wsLink` work unchanged; there is one WebSocket
  entry, and new features extend the router.
- **Considered and not used:** a second WebSocket entry or server.
- **Revisit when:** tRPC ships an official crossws adapter.

## Nitro dev patch for WebSockets under Bun

2026-09-29 · #13

- **Context:** Nitro's Vite dev worker does not install the crossws Bun plugin, so `vite dev`
  under Bun cannot upgrade sockets.
- **Decision:** `patches/nitro@<version>.patch`, applied by `bun install` through
  `patchedDependencies`.
- **Consequence:** the patch key is the exact nitro version; a bump drops it silently (see
  `tasks/lessons.md`).
- **Considered and not used:** none recorded.
- **Revisit when:** nitro installs the plugin itself, or on every nitro bump.

## One app: realtime collapsed into studio

2026-09-29 · #13

- **Context:** studio and a separate realtime app needed a JWT/JWKS hop, two deploys and two
  configs.
- **Decision:** one Nitro/Bun process serves SSR, `/api/auth`, `/api/trpc` and `/trpc-ws`.
- **Consequence:** one Coolify app and one database; scaling sockets means scaling the app.
- **Considered and not used:** the two-app shape (still the Elysia sibling's); a separate
  headless realtime app type in the generator.
- **Revisit when:** socket load needs to scale apart from SSR.
