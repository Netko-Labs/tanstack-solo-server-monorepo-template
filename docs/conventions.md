# Conventions

Portable code-style and folder-structure rules. These are project-agnostic and meant to be reused
across repositories — import this file from a repo's `CLAUDE.md` (e.g. `@docs/conventions.md`) and
keep project-specific topology, commands, and data-flow notes in `CLAUDE.md` itself.

This file uses neutral placeholders: `{app}`, `{context}`, `{module}`, `{entity}`, `{kind}`,
`{integration}`, `{service}`, `@org/*`. Swap them for the host project's equivalents.

## 1. Vocabulary

| Term | Meaning |
| --- | --- |
| context | A grouping folder that owns child modules (`components/`, `integrations/`, a feature folder, a backend layer). |
| module | A folder with a public surface and an `index.ts` barrel. A **component module** has a `.tsx`; a **logic module** does not. |
| `lib/` | A context's internal implementation: `hooks/`, `utils`, `types`, `constants`, `values`. Private to the context. Universal — any app or backend layer. |
| `hooks/` | Obligatory subfolder for `use-*.ts` hooks, in any module. |
| `shared/` | Per-context reuse bucket (`{context}/shared/`): code reused by lower levels in the subtree, or exported. Universal across the monorepo. |
| `core/` | App-root providers, layouts, and shells not tied to a single feature. |
| store | Client-state coordination (e.g. a Zustand store), colocated with the feature it serves. |
| barrel | An `index.ts` that only re-exports. |
| layer | A backend package: `domain`, `repository`, `service`, `trpc`. |
| kind | A service top-level folder by role: `queries`, `mutations`, `utils`, `values`, `logger`. |
| integration | A service folder whose children are interchangeable providers (`email/resend/`), with a dispatcher at its root. |

## 2. Modules & Scope

A module is a folder with a public surface plus an `index.ts` barrel. Internals live under `lib/`;
anything reused or exported lives under `shared/`.

### Two core buckets — universal across the whole monorepo

Both buckets are valid in every app and every backend layer (`domain` included). No context is
exempt.

- **`lib/` — a context's internal implementation.** Groups the context's private supporting code:
  `hooks/`, `utils`, `types`, `constants`, `values`. Use it to separate internals from the context's
  primary artifact (a component `.tsx`, a layer's operation files, a domain table). A small module
  may keep a single category file at its root and introduce `lib/` once there are internals worth
  grouping.
- **`shared/` — a per-context reuse bucket.** Something belongs in `{context}/shared/` when it is
  reused by lower levels in that context's subtree, or exported to another app/package. Cross-app
  exports graduate out of the app to `packages/shared/*`.

### Module anatomy

A **component module** keeps the `.tsx` (and nested sub-components) at the root; internals nest
under `lib/`:

```
components/{feature}/                 # e.g. components/dashboard/message-feed/
  {feature}.tsx                       # public artifact(s)
  {feature}-item/                     # nested sub-components get their own folders
  lib/                                # internal implementation
    hooks/
      use-{feature}.ts                # hooks ALWAYS live in a hooks/ subfolder
    utils.ts                          # → utils/ when many OR a file > 300 lines
    types.ts                          # → types/ when many OR > 300 lines
    constants.ts                      # → constants/ when many OR > 300 lines
    values.ts                         # → values/ when many OR > 300 lines
    index.ts
  index.ts                            # barrel
```

A **logic / utility module** (no component) places its category files/folders at the module root —
no `lib/` wrapper, since the module itself is the implementation:

```
{context}/shared/{module}/            # e.g. components/shared/dom-events/
  hooks/
    use-document-keydown.ts
    use-sync-on-visible.ts
  utils.ts                            # → utils/ when many OR > 300 lines
  types.ts                            # → types/ when many OR > 300 lines
  constants.ts                        # → constants/ when many OR > 300 lines
  values.ts                           # → values/ when many OR > 300 lines
  index.ts
```

### Rules

- **`hooks/` is an obligatory subfolder** in every module (component or logic) — even for one hook.
  A module is a folder with files split by kind; never a single file mixing hooks, utils, and types.
- **Progressive disclosure** for `utils`, `types`, `constants`, and `values`: start as a single flat
  file (`utils.ts`); promote to a category subfolder (`utils/`) only when the category has **many
  entries OR a file exceeds 300 lines**. This applies uniformly to all four categories; only
  `hooks/` is always a subfolder.
- **Barrel:** `index.ts` re-exports only — no declarations or logic.
- **No inline type declarations** in implementation files (`.tsx`, hooks, stores, handlers,
  `utils.ts`). Types live in the module's `types.ts` (or `types/`).
- **Constants** export as `UPPER_SNAKE_CASE` (e.g. `IDEMPOTENCY_KEY_PREFIX`, `UPLOAD_EXPIRY`).
- **`lib/` holds no JSX, side effects, or runtime entry points** beyond pure helpers and hooks —
  declarations (`types`/`constants`/`values`) carry no runtime logic.

### Scope ladder (narrowest → widest)

1. **module-internal** → `lib/` (or the module root for a logic module)
2. **context reuse** → `{context}/shared/{module}/` (same anatomy)
3. **app-root foundational** → `components/core/` (providers, layouts, shells)
4. **cross-app** → `packages/shared/*`

### Placement

A module's "internal area" = `lib/` for a component module, or the module root for a logic module.

| You have… | Put it in |
| --- | --- |
| a hook | the internal area's `hooks/use-*.ts` (always a `hooks/` subfolder) |
| a pure helper | internal `utils.ts` → `utils/` when many or > 300 lines |
| a type / interface / enum | internal `types.ts` → `types/` when many or > 300 lines |
| immutable config / limit / key | internal `constants.ts` (`UPPER_SNAKE_CASE`) → `constants/` when many or > 300 lines |
| static copy / preset / label map | internal `values.ts` → `values/` when many or > 300 lines |
| the module barrel | `{module}/index.ts` (re-exports only) |
| code reused lower in a context, or exported | `{context}/shared/{module}/` |
| an app-root provider / layout / shell | `components/core/` |
| a cross-app primitive | `packages/shared/*` |
| shared client state / command registration | a feature store (`use-*-store.ts`); server state stays in the data layer |
| a cross-feature DOM event helper | a `shared/` logic module (e.g. `shared/dom-events/`), never a `window` event bus |

**Every module — component or logic — has a root `index.ts` barrel**, and it is the module's only
public entry. Import a module through its barrel (`@/{context}/{module}`), never through its inner
files: not the component file (`.../{module}/{module}`) and not its `lib/` internals. The barrel
re-exports the module's public surface (the component, public hooks/helpers) — internals stay
unexported.

## 3. Backend Layering

Strict one-way dependency:

```
domain  →  repository  →  service  →  trpc  →  ui
```

The universal conventions from §2 — `lib/` (internal), `shared/` (reused/exported), the obligatory
`hooks/` subfolder, and the "many or > 300 lines" promotion rule — apply to **every** layer; no
layer is exempt. Layers differ only in their layer-specific top-level folders.

**`domain`** — the data model. Fixed category folders, plus universal `lib/` and `shared/`:

```
domain/      db/         table definitions
             entities/   db entities — drizzle-derived schemas ONLY
             schemas/    hand-written schemas: inputs, outputs, filters, projections, app config
             values/     client-visible limits, enums, error codes
             factory/    factories
             lib/        internal helpers/types          # universal
             shared/     reused/exported helpers/types   # universal
             index.ts
```

An **entity** is produced from a table by a drizzle utility — `createSelectSchema`,
`createInsertSchema`, `createUpdateSchema` — and nothing else. A shape someone typed by hand is a
schema, even when it wraps an entity: filters, request inputs, response envelopes, joined
projections and app config all live in `schemas/{entity}.ts` (a flat file; a folder only past 300
lines) and compose entities with `.pick()`/`.extend()`.

- Client-visible limits and enums live in `values/{entity}.ts`, and schemas import them; status
  enums derive as `z.enum(pgEnum.enumValues)`. Server-only knobs live in `service/values/{entity}/`.
- A permission predicate that both the UI and the server check lives in `domain/shared/`.
- Column helpers live in `db/lib/`. jsonb columns use a pass-through `customType`: drizzle's
  `jsonb()` double-stringifies under bun-sql.

**`repository`** — db access primitives, and only those:

```
repository/  db/      client + Tx type + migrations + seed (optional)
             cache/   cache client + pub/sub primitives
             shared/  cross-module helpers/types
             index.ts
```

The repository owns *how to reach* the database, never *what to ask it*: the client, the `Tx`
type, migrations, an optional seed, and the cache client with its pub/sub primitives. Named queries
and mutations do not belong here — a `find-user-by-email.ts` under `repository/` is a layering bug,
not a repository. Object storage and other external services are not repository concerns: they get
a shared client (see **External services**). A seed refuses to run in production, is re-runnable,
and deletes and re-inserts only its own rows.

**`service`** — business logic and every operation that touches the database. Folders read
**general to specific**: the top level is the *kind* of thing, the level under it is the *entity*
it serves, and the file is one concept:

```
service/     {kind}/{entity}/{name}.ts + index.ts
             queries/{entity}/{op}.ts                 # read operations
             mutations/{entity}/{op}.ts               # write operations
             utils/{entity}/{name}.ts                 # pure helpers
             values/{entity}/{name}.ts                # server-only limits, presets, tables
             logger/{entity}/{name}.ts                # configured loggers
             {integration}/                           # see below
             lib/      internal helpers/types                 # universal
             shared/   reused/exported helpers/types          # universal
             index.ts
```

`queries/`, `mutations/`, `utils/`, `values/` and `logger/` are the service's layer-specific kinds,
the way `entities/` and `values/` are domain's. They sit beside §2's `lib/` and `shared/`, which
keep their meaning inside every module.

Every operation that touches the database — trivial single-table reads included — is a service
query or mutation, and issues its drizzle calls directly. Reuse means importing another service
operation, never moving it into `repository`. Composite operations import the granular ones and
wrap them in one `db.transaction`; a granular op takes `tx: Tx` first when a composite needs it.
Side effects (broadcasts, email) run in service after the transaction resolves, never in a router.

One concept per file: one operation, one value group, one error with its codes. Files under
`queries/` and `mutations/` export exactly one operation. Grab-bag modules (`*-utils.ts` holding
unrelated helpers) are split by concept.

**Integrations invert the order.** A folder is an integration when the folder itself *is* the
generality and its children are interchangeable providers, not entities: `email/` holds
`email/resend/`, `email/smtp/`, `email/console/`, and a dispatcher at its root picks between them.
An integration may keep grouped files at its root. Everything else follows kind-then-entity.

**Service errors.** An operation that fails on purpose throws an `{Entity}Error` carrying a `code`;
the class lives in service next to the operations that throw it. The code list is an `as const`
array in `domain/values/{entity}.ts`, so the UI's copy maps can be exhaustive. One middleware on
the base procedure maps these errors to `TRPCError` with `message = code`; nothing else crosses
the edge as a message. The UI maps codes to copy with a generic fallback and never shows raw
server text.

**`trpc`** — API composition only:

```
trpc/        routers/{entity}/{queries,mutations,subscriptions}.ts + index.ts (mergeRouters)
             shared/   cross-router helpers/types, procedure builders
             init.ts   context + procedures (protected/public)
             index.ts  appRouter
```

Architecture rules:

- Keep the flow aligned as `domain → repository → service → trpc → ui`.
- `repository` exposes db access primitives; `service` owns every query, mutation, and business
  rule; `trpc` wires routers and validates the edge.
- In `service`, name folders general-to-specific — `{kind}/{entity}/{name}.ts`. Only a
  provider-backed integration inverts it (`email/resend/`).
- **Every query and mutation declares both `.input()` and `.output()`**, and both schemas come
  from `domain`. An inline `z.object(...)` in a router means a schema is missing from `domain`;
  the `trpc` package does not depend on zod. Subscriptions declare `.input()` only, because tRPC's
  output parser would consume the async iterable; their events are typed and parsed in service.
- Role or permission gates are parameterized procedure builders in `trpc/shared/{concern}.ts` that
  add the actor to `ctx`; the predicate they check lives in `domain/shared/`. Row ownership is a
  where-clause in every service query, covered by a test. No RLS.
- When extending routers, merge smaller concern-specific routers instead of growing one file.

### External services

Every external service (an HTTP API, object storage, a signing scheme) gets its own package,
`packages/shared/{service}-client` (`@org/{service}-client`). Scaffold it with the library
generator's **client** kind.

```
packages/shared/{service}-client/src/
  {service}-client.ts   createXClient(config) → typed client; auth, signing, HTTP, retries
  types.ts              XClientConfig + request/response types
  errors.ts             XApiError carrying the service's own error code/detail
  values.ts             endpoints, versions, limits
  index.ts              barrel
```

- **Transport only.** Auth, token caching, request signing, the wire format and the service's
  errors. No app config, no database, no logger, no business mapping.
- **Config comes in as arguments.** The client never reads `process.env` or an app config
  package; the calling layer passes the values.
- **The service's third-party libraries live in the client** (its SDK, signing or crypto
  libraries), not in `service`.
- **`service` owns the mapping.** A small getter per integration builds the client from app config
  once, and service code turns domain data into the client's requests and persists what comes
  back.
- Webhook verification helpers belong to the client too, so a route can check a signature
  without pulling in `service`.

## 4. Component Authoring

These rules apply to frontend UI code (apps and shared UI packages). They extend §2.

### Hierarchy and atomization

- Structure components as a shallow tree, not a flat list of large files. Each folder owns one
  concern and composes smaller children, nesting feature → section → element (e.g.
  `components/{feature}/{feature}-section/{feature}-element/`).
- Cross-feature reusable UI belongs in a `shared/` context; app-root foundational UI belongs in
  `core/`; primitives used across multiple features belong in `packages/shared/*`.
- Prefer many small components over one component with large conditional branches. Extract when a
  section has its own props, state boundary, or reuse potential.
- Name folders and files consistently: `{feature}-{section}.tsx`, `{feature}-{element}.tsx`.
- Keep route files thin — export `Route` and delegate substantial UI to a component under
  `components/` or a route-specific feature folder.
- Navigation is a `Link` styled with `buttonVariants()`; `Button` is for actions. A `Link` rendered
  through `Button` makes Base UI treat the anchor as a button and log an error.

### Size and hook budgets

- **Line budget:** `.tsx` files and colocated `.ts` files (hooks, handlers) should stay **≤ 300
  lines**. Exceeding 300 lines requires a documented reason (e.g. code-generated markup, a single
  cohesive state machine) and a plan to split when next touched.
- **Hook budget:** a component file should use **≤ 3 React hooks** (`useState`, `useEffect`,
  `useMemo`, `useCallback`, `useRef`, context hooks, query hooks, etc.). Count each custom hook as
  one hook.
- When logic exceeds the budget, extract a colocated custom hook into `lib/hooks/` or move shared
  client state to a store. Split hooks by concern — data fetching, subscriptions, copy/actions,
  keyboard shortcuts, and bridge registration each get their own hook. If the overflow is *state that
  distant or sibling UI also touches*, lift that slice into a store; local/ephemeral state stays in
  the hook — see **State & Wiring**.
- Presentation stays in the component; data fetching, subscriptions, derived state, and pure helpers
  move to hooks, `lib/`, a `shared/` module, or a store.
- Vendored UI primitives (shadcn CLI output, e.g. `packages/shared/ui/src/components/**`) are
  exempt from the line and hook budgets and the `window` rule. Regenerate them rather than edit them.

## 5. State & Wiring

These rules apply to frontend client wiring. Prefer the simplest option that keeps producers and
consumers in sync:

1. **Props and callbacks** when both sides share a parent.
2. **A client state store** (e.g. Zustand) when distant UI needs shared client state or imperative
   command registration (e.g. a feed, sidebar, top bar, command palette).
3. **DOM helpers** in a `shared/` logic module (e.g. `shared/dom-events/`) for real browser events
   (`useDocumentKeydown`, `useSyncOnVisible`).

**Prefer a store over a state-heavy hook — when the state is actually shared**

When a hook coordinates state that **distant or sibling UI also reads/writes** — and that hook has
grown into a state machine (many atoms plus the effects wiring them) — move that state and its
actions into a colocated store instead of prop-drilling or fanning into more orchestrating sub-hooks.
Consumers then subscribe with selectors. The trigger is **shared reach**, not atom count:

- ✅ Extract: the state feeds a command palette, a sibling toolbar/panel, or app-level coordination
  (e.g. a `dashboard` store that a feed, top bar, and command palette all register into and read).
- ❌ Keep it a hook: state that is **local, ephemeral, or per-instance** — dialog open flags, form
  fields, copied/“just saved” flags, search text, per-channel feed buffers — even with many atoms.
  A global store here breaks remount-reset semantics and per-instance isolation, and adds ceremony
  with no sharing benefit. Tame the complexity by decomposing into focused sub-hooks and lifting
  only the genuinely-shared slice into the store.

Reserve hooks for view-bound glue — wiring props, local ephemeral UI state, and effects; put shared
or heavy state and
imperative coordination in a store.

**Client state stores**

- Colocate stores under the feature they serve (e.g. `components/{feature}/use-{feature}-store.ts`).
- Keep server state in the data-fetching layer (e.g. React Query); stores hold UI coordination and
  handlers, not fetched entities.
- Subscribe narrowly with selectors so unrelated updates do not re-render the tree.
- Call `getState()` in event callbacks when handlers must stay fresh without subscribing.
- Use `register*` + cleanup when a mounted feature owns handlers so unmount clears stale references.
- Prefer feature-scoped stores over one app-wide store. React Context is fine for static providers
  (theme, auth wrappers), not growing mutable coordination state.

The reference app has no shared-reach client state on purpose, so it ships no store. When one is
needed, this is the shape (a mounted feature registers a handler; distant UI calls it):

```ts
export const useFeedStore = create<FeedStore>((set, get) => ({
  focusFeed: null,
  registerFocus: (focus) => {
    set({ focusFeed: focus })
    return () => set({ focusFeed: null })
  },
  requestFocus: () => get().focusFeed?.(),
}))
```

**No `window` event bus** — do not use `window.dispatchEvent`, custom `window` listeners, or
`window` as application pub/sub.

- **Keyboard shortcuts:** a document-level hook (e.g. `useDocumentKeydown`), not scattered
  `window.addEventListener('keydown', ...)`.
- **Tab focus / permission sync:** a visibility hook on `document.visibilitychange` (e.g.
  `useSyncOnVisible`); do not duplicate with a `window` `focus` listener.
- **`window` is allowed** for unavoidable browser APIs (`window.location`, `window.open`,
  `Notification`, `localStorage`).
- **Viewport-wide pointer tracking** may use `window` listeners in a single hook when `document` is
  insufficient; document why.

**Server data in the UI**

- **Route data and guards** go through `integrations/{concern}/get-*.ts`, which exports one
  `createServerFn` that calls a service query and returns a domain type, consumed in `beforeLoad`
  or `loader`. Gated surfaces sit under a layout route whose `beforeLoad` redirects and returns the
  session as context.
- **Mutations:** one `mutationOptions` hook per action. The procedure's `.output()` is the
  write-back: invalidate the list, or `setQueryData` when the output is the whole list. Clear forms
  only in `onSuccess`. Optimistic updates are an opt-in.
- **Forms** validate with the domain schema the procedure's `.input()` declares; no local regexes.
- **List hooks** return `isError: query.isError && !query.data` and
  `retry: () => void query.refetch()`; views render error, then pending, then empty, then content.
- **Errors** reach the user as copy mapped from the service error `code`, with a generic fallback;
  raw server text is never shown.

## 6. Code Style

- Prefer the repo's package manager and scripts over ad-hoc npm/pnpm/yarn commands.
- Honor the repo's formatter/linter and its config (indentation, line width, quote style, naming
  convention). Do not fight the configured rules.
- Reuse existing import aliases (e.g. `@/*` inside apps) instead of adding deep relative imports.
- Prefer shared UI primitives and the project's icon set before adding or hand-rolling UI building
  blocks.
- Avoid `any`, `@ts-ignore`, and loosely typed boundaries when a type-safe alternative is practical.
- Keep changes tightly scoped; do not refactor unrelated areas while fixing a focused problem.
- Update supporting artifacts when required, including schema, migrations, generated files, or docs.

### Comments

- Zero comments is a file's default state; names and structure carry the meaning.
- A comment carries only what code cannot: a constraint, an invariant, why not the obvious way, an
  external system's quirk, units, side effects. One or two lines; longer reasoning goes to `docs/`
  or the PR.
- If a comment explains *what*, rename or restructure until it is unnecessary.
- Never: section-header banners, comments on object properties, narration, reviewer-directed
  justification.
- No TSDoc/JSDoc by default; types and names are the docs.
- Required comments stay: the `// conventions: >300 lines — <reason>` waiver and `SAFETY:`
  annotations.

## 7. Workflow

### Working principles

- Prefer the smallest safe change that solves the problem.
- Follow existing patterns before introducing new abstractions.
- Fix root causes instead of layering on workarounds.
- Do not add new dependencies unless the current stack cannot solve the problem cleanly.
- Be explicit about uncertainty, tradeoffs, and anything you could not verify.

### Task management

Use a `tasks/` directory for non-trivial work that needs a visible checklist or checkpoint trail:

- `tasks/todo.md` — `# Task checklist`, then one `## Active — <title> (YYYY-MM-DD)` section per
  piece of work: a context line, `Stack:` (branches), `- [ ] <layer>: …` items,
  `- [ ] verify: <command> — <evidence>` (an open item names what blocked it), and
  `- acceptance: …`. Start a section when work spans more than one commit or session. When it
  merges, collapse it to one line under `## Completed`.
- `tasks/lessons.md` — category headings; each entry is
  `**<rule>.** <what broke>. Found <date> in <file/PR>.`, plus a check when a mechanical one
  exists. Add one after every correction; update an existing entry instead of repeating it.
- `docs/decisions.md` — decisions that are settled, with what was considered and not used. Read
  it before proposing a change in an area it covers; add an entry when a choice is made.

Keep task files short and current. Do not create them for one-line fixes.

### Commit convention

Commit freely at logical checkpoints, using `<emoji> <type>(<scope>?): <subject>`
(commitlint-enforced where adopted). Push or open a PR only when asked. Never commit directly to
main in multi-branch repos — branch first.

Commit types: `✨ feat`, `🐛 fix`, `📝 docs`, `💄 style`, `♻️ refactor`, `⚡ perf`, `✅ test`,
`🔧 chore`, `🏗️ build`, `👷 ci`, `🔒 security`. This is the only list: `commitlint.config.mjs`
enforces exactly these types, and the PR template does not repeat them.

## 8. Testing

- A test of `{dir}/{file}.ts` lives at `{dir}/_tests/{file}.test.ts`: a `_tests/` folder at the
  same level as its subject (component, service op, domain model, utils), importing it from `../`.
  Test-only helpers and fakes sit in the same `_tests/`. `_tests/` is not a module: no barrel,
  nothing imports from it. Run with `bun test`; every package's `test` script is
  `bun test --pass-with-no-tests`.

  ```
  lib/utils.ts
  lib/_tests/utils.test.ts
  mutations/todos/_tests/ownership.test.ts
  ```
- One recipe per layer:
  - **domain** — parse and reject cases for a schema.
  - **repository / service** — against real Postgres or Redis, gated with
    `describe.skipIf(!gatedEnv('DATABASE_URL'))` (or `CACHE_URL`); `gatedEnv` fails instead of
    skipping when `REQUIRE_GATED_SUITES` is set, as CI does. Migrations applied first, unique ids
    per run, `afterAll` deletes only the rows the test made.
  - **trpc** — `appRouter.createCaller(ctx)` with null, expired and valid sessions. A sweep over
    the router asserts the public allow-list and that every query and mutation has an output
    parser.
  - **ws** — a fake peer driving the stock protocol.
  - **ui** — pure reducers and helpers in `lib/utils.ts`; behavior beyond that is a smoke run.
- A run that skipped a gated suite is not a pass for changes to that layer.
- A test helper is extracted on its third copy, following the scope ladder in §2.
