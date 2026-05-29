# AGENTS.md

This file applies to the whole repository unless a deeper `AGENTS.md` overrides it.

## Working Principles

- Prefer the smallest safe change that solves the problem.
- Follow existing patterns before introducing new abstractions.
- Fix root causes instead of layering on workarounds.
- Do not add new dependencies unless the current stack cannot solve the problem cleanly.
- Be explicit about uncertainty, tradeoffs, and anything you could not verify.

## Repository Overview

- Runtime and package manager: `bun@1.2.23`
- Monorepo tooling: Turborepo
- Web app: `apps/studio` using TanStack Start, React 19, Tailwind, Base UI, Tabler Icons, and tRPC
- Studio domain package: `packages/studio/domain`
- Studio repository package: `packages/studio/repository`
- Studio service package: `packages/studio/service`
- Studio tRPC package: `packages/studio/trpc`
- Shared tooling and UI packages live under `packages/shared/*` (`cli`, `logger`, `ui`, `typescript-config`)
- Environment and config for the studio stack live in `packages/configs/studio-config`

When extending this template with additional apps (e.g. mobile, realtime), colocate app-specific packages under `packages/{app-name}/*` and config under `packages/configs/{app-name}-config`. Keep cross-cutting concerns in `packages/shared/*`.

## Architecture Rules

- Keep the studio backend flow aligned as `domain -> repository -> service -> trpc -> frontend`.
- Keep app-specific WebSocket or realtime-only concerns out of `packages/studio/*` unless they belong to the studio stack.
- Put database schema definitions and `drizzle-zod` entities in `packages/studio/domain`.
- Keep direct database access in `packages/studio/repository`.
- Keep business logic in `packages/studio/service`.
- Keep API composition and router wiring in `packages/studio/trpc`.
- In the service layer, prefer the existing folder-per-entity structure under `src/queries/*` and `src/mutations/*`.
- When extending routers, merge smaller concern-specific routers instead of growing one large file.
- Use `drizzle-zod` with `createInsertSchema()`, `createUpdateSchema()`, and `createSelectSchema()`.
- Use dual tRPC clients where needed: HTTP for queries/mutations and SSE subscriptions; WebSocket for real-time subscriptions when applicable.

## Scaffolding

- **`bun run gen:app`** — Turbo generator in `turbo/generators/config.ts`. Creates the app under `apps/{name}` plus layered packages (`domain`, `repository`, `service`, `trpc`) and `packages/configs/{name}-config`.
- **TanStack Start template** — `turbo/generators/templates/app-tanstack/`. Aligns with `apps/studio`: `@/*` path alias, `components/core/root/` shell, split tRPC client under `src/integrations/trpc/`, TanStack Query provider, `@temp-repo/ui`, Nitro + rolldown-vite.
- **Hono API template** — `turbo/generators/templates/app-hono/`. API server with tRPC and database layers.
- **Reference app** — treat `apps/studio` as the living example when extending a generated app. Root `AGENTS.md` applies to all apps unless an app adds a local override.
- **`bun run gen:lib`** — shared library under `packages/shared/{name}`.

## Definitions layout

These rules apply across the monorepo — apps (`components/`, `src/lib/`), and packages (`service`, `trpc`, `shared/*`, `configs/*`, etc.) — for every module folder that owns types, constants, or static values.

**Exception:** `packages/*/domain` keeps its existing schema/entity layout (Drizzle tables, zod schemas, shared entities). Repository, service, and other packages use `definitions/` for module-local types, constants, and values.

### Folder layout

Every module that needs definitions uses:

```
{module}/
  …implementation files…   # components, hooks, utils.ts, handlers — no inline types/constants/values
  definitions/
    types.ts        # required when the module has types
    constants.ts    # optional — immutable config, limits, keys, storage keys
    values.ts       # optional — static copy, presets, label maps
    index.ts        # re-exports only; no definitions here
  lib/              # optional — pure helpers when the module is a UI feature folder
    utils.ts
```

App lib modules use the same shape under `apps/{app}/src/lib/{module}/`:

```
apps/studio/src/lib/format-date/
  definitions/types.ts
  definitions/index.ts
  utils.ts
  index.ts              # export * from './utils'; export * from './definitions'
```

Service and package modules follow the same pattern, e.g. `packages/studio/service/src/webhook/definitions/`.

Import from the module barrel (`@/lib/format-date`, `./definitions`) — not from individual definition files outside the same module tree.

- **`types.ts`** — `interface`, `type`, and enum declarations.
- **No inline type declarations** — do not declare `interface` or named `type` aliases in implementation files (`.tsx`, hooks, stores, handlers, `utils.ts`). Put them in the module's `definitions/types.ts`. Subfolders may share a parent barrel when types are module-wide.
- **`constants.ts`** — immutable config: limits, keys, storage keys, MIME maps, filter shortcuts. Export as **`UPPER_SNAKE_CASE`** (e.g. `DEMO_TAG`, `IDEMPOTENCY_KEY_PREFIX`, `UPLOAD_EXPIRY`). Do not rename existing uppercase constants to camelCase when moving them into `definitions/`.
- **`values.ts`** — static copy, presets, label maps, shortcut groups.
- **`definitions/index.ts`** — barrel re-exporting `./types`, `./constants`, `./values`. Do not define types or values in this file.

Minimum set: `types.ts` + `definitions/index.ts`. Add `constants.ts` and/or `values.ts` only when needed.

#### What does not belong in `definitions/`

- No JSX, hooks, side effects, or runtime logic.
- No helper or utility functions — use `utils.ts`, colocated `lib/utils.ts`, or app `src/lib/{module}/utils.ts`.
- **Entities, DB schemas, and validation** belong in **domain** packages when shared across layers. Repository modules colocate persistence-local types and config in `definitions/`.

## Frontend Component Rules

These rules apply to UI code in `apps/studio` and packages under `packages/shared/*`. They extend **Definitions layout** above.

### Definitions in components

Colocate UI-scoped definitions in a `definitions/` folder inside the feature folder. Import from `./definitions` in `.tsx` and colocated `.ts` siblings.

#### Component folder example

```
components/todos/todos-example/
  todos-example.tsx
  use-todos-example.ts
  definitions/
    types.ts
    constants.ts
    values.ts
    index.ts
  lib/
    utils.ts
```

Import from `./definitions` or `@/components/.../definitions`, not from individual definition files outside the same feature tree.

### Helpers and utils

Pure helper functions (formatting, mapping, predicates, small transforms) do not belong in `definitions/`, components, or hooks.

- **Feature-scoped helpers** — colocate under `lib/` in the same feature folder:

```
components/settings/organizations-section/
  organizations-section.tsx
  use-settings-organizations.ts
  definitions/
  lib/
    utils.ts        # generic transforms for this feature
    helpers.ts      # optional — use when utils.ts is not a fit; pick one file when possible
```

Use **`lib/utils.ts`** for generic pure functions. Use **`lib/helpers.ts`** when helpers are feature-specific glue that does not fit a generic utils name. Prefer one file per folder until size warrants a split.

- **App-wide helpers** — shared across features within an app live in `apps/{app}/src/lib/{module}/` (e.g. `apps/studio/src/lib/format-date/` when the module has definitions, or a single `utils.ts` for logic-only modules). Do not duplicate the same helper in multiple feature folders.

### Component hierarchy and atomization

- Structure components as a **shallow tree**, not a flat list of large files. Each folder owns one concern and composes smaller children.
- **Feature-scoped UI** — nest by feature, then section, then element:

```
components/todos/
  todos-example/
    todos-example.tsx
    definitions/
    todo-list/
      todo-list.tsx
      todo-item/
        todo-item.tsx
```

- **Cross-feature reusable UI** — use `shared/` (within an app) or `packages/shared/ui` for primitives and patterns used in multiple features (buttons, dialogs, layout shells).
- **App-wide foundational UI** — use `core/` for root-level providers, layouts, and shells that are not tied to a single feature.
- Prefer **many small components** over one component with large conditional branches. Extract when a section has its own props, state boundary, or reuse potential.
- Name folders and files consistently: `{feature}-{section}.tsx`, `{feature}-{element}.tsx`.
- Keep **route files thin** — export `Route` and delegate to a component under `components/` or `routes/` feature folders.

### Component size and hooks

- **Line budget:** `.tsx` component files and colocated `.ts` files (hooks, handlers) should stay **≤ 300 lines**. Exceeding 300 lines requires a documented reason (e.g. code-generated markup, a single cohesive state machine) and a plan to split when touched again.
- **Custom hook budget:** `use-*.ts` files follow the same **≤ 300 line** cap. Split hooks by concern — data fetching, subscriptions, copy/actions, keyboard shortcuts, and bridge registration each get their own colocated hook or `lib/` helper rather than one orchestrator file.
- **Hook budget:** A component file should use **≤ 3 React hooks** (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, context hooks, query hooks, etc.). Count custom hooks as one hook each.
- When logic exceeds the hook budget, extract a **colocated custom hook** (e.g. `use-todos-example.ts` next to `todos-example.tsx`) or move shared client state to a **Zustand store** when multiple components subscribe to the same state.
- Presentation stays in the component; data fetching, subscriptions, derived state, and pure helpers move to hooks, feature `lib/`, app `src/lib/`, or stores.

### Cross-feature client wiring

Prefer the simplest option that keeps producers and consumers in sync:

1. **Props and callbacks** when both sides share a parent.
2. **Zustand** when distant UI needs shared client state or imperative command registration (e.g. dashboard feed, sidebar, top bar, command palette).
3. **DOM helpers** in `apps/{app}/src/lib/dom-events.ts` for real browser events (`useDocumentKeydown`, `useSyncOnVisible`).

**Zustand**

- Colocate stores under the feature they serve, e.g. `components/dashboard/dashboard-bridge/use-dashboard-store.ts`.
- Keep **server state in React Query**; stores hold UI coordination and handlers, not fetched entities.
- **Subscribe narrowly** with selectors so unrelated updates do not re-render the tree.
- **Call `getState()`** in event callbacks when handlers must stay fresh without subscribing to command objects.
- Use **`register*` + cleanup** when a mounted feature owns handlers so unmount clears stale references.
- Prefer **feature-scoped stores** over one app-wide store. React Context is fine for static providers (theme, auth wrappers), not growing mutable coordination state.

**No `window` event bus**

Do not use `window.dispatchEvent`, custom `window` listeners, or `window` as application pub/sub.

- **Keyboard shortcuts:** `useDocumentKeydown` (or a feature wrapper), not scattered `window.addEventListener('keydown', …)`.
- **Tab focus / permission sync:** `useSyncOnVisible` on `document.visibilitychange`; do not duplicate with `window` `focus`.
- **`window` is allowed** for unavoidable browser APIs (`window.location`, `window.open`, `Notification`, `localStorage`).
- **Viewport-wide pointer tracking** (e.g. shader stage) may use `window` listeners in one hook when `document` is insufficient; document why.

## Commands

- Web development: `bun run repo dev --app studio` (localhost:3000)
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

## Code Style

- Prefer `bun run ...` over npm, pnpm, or yarn commands.
- Formatting and linting use Biome with 2-space indentation, 100-character line width, and single quotes except in JSX.
- Reuse existing import aliases such as `@/*` inside apps instead of adding deep relative imports.
- Avoid `any`, `@ts-ignore`, and loosely typed boundaries when a type-safe alternative is practical.
- Keep changes tightly scoped; do not refactor unrelated areas while fixing a focused problem.
- Update supporting artifacts when required, including schema, migrations, generated files, or docs.

## Verification

- Start with the smallest relevant check for the code you changed, then broaden as needed.
- Before handing work off, run the relevant subset of:
  - `bun run check-types`
  - `bun run fmt-lint`
  - `bun run test`
- If database code changes, run the appropriate `db:*` command or explain why it was not run.
- If you cannot run a command, document the reason and note the remaining risk.

## Task Management

Use `tasks/` directory for non-trivial work:

- `tasks/todo.md` — checklist with acceptance criteria, track progress, checkpoint notes
- `tasks/lessons.md` — capture failure modes and prevention rules after corrections

## Handoff Notes

- Reference concrete files and commands when summarizing work.
- Call out any follow-up steps needed when contracts or shared packages change.
- If asked to commit, use the repository convention: `<emoji> <type>(<scope>?): <subject>`.

Types: ✨ feat, 🐛 fix, 📝 docs, 💄 style, ♻️ refactor, ⚡ perf, ✅ test, 🔧 chore, 🏗️ build, 👷 ci, 🔒 security

## GitHub Automation

This repo uses [OpenCode](https://opencode.ai/docs/github/) for GitHub automation.

- Mention `/oc` or `/opencode` in issue or PR comments to trigger the assistant workflow
- PR reviews run automatically via CI after quality checks pass
- Set repository secrets:
  - `OPENCODE_API_KEY` (from [opencode.ai/auth](https://opencode.ai/auth))
  - `OPENCODE_MODEL` (e.g. `opencode/deepseek-v4-flash-free`)
