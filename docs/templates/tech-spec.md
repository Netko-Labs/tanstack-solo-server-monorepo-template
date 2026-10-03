# <Project> — tech spec

Version <n.n> · <YYYY-MM-DD> · built on the repo, not the PRD

<One sentence: what we are building and for whom. Everything below starts from what this template
already ships and names every change.>

## §0 Foundation

What the repo already gives us. This is the ground truth; the spec extends it.

| Layer | Exists today | Spec does |
| --- | --- | --- |
| Monorepo | Bun, Turborepo, Biome, husky + commitlint, repo CLI (`dev`, `build`, `db:*`, `docker:*`, `gen:app`, `gen:lib`), Railpack config, bundled migrator | <keep as is \| change> |
| `packages/{app}/domain` | Drizzle tables (better-auth, todos, chat), drizzle-zod entities, hand-written schemas, values | <tables and schemas added> |
| `packages/{app}/repository` | Postgres client on bun-sql, migrations, Redis cache client | <keep as is \| change> |
| `packages/{app}/service` | better-auth (magic link, optional OAuth), todos queries and mutations, chat, room hub over a local or Redis bus, email | <operations added per entity> |
| `packages/{app}/trpc` | `init.ts` (logging, public and protected procedures), routers `auth`, `room`, `todos`, WebSocket bridge at `/trpc-ws` | <routers and procedure builders added> |
| `packages/configs/{app}-config` | env → typed app config, production fail-fast | <keys added> |
| `apps/{app}` | TanStack Start on Nitro/Bun: SSR, `/api/auth`, `/api/trpc`, `/trpc-ws`, `/api/health`; split tRPC client; `@temp-repo/ui` | <routes and surfaces added> |
| Infra | Coolify + Railpack, migrate in `startCommand`; local compose with Postgres and Redis | <apps, databases, services added> |

## §1 Product

<A table: Pillar | What it is | Release. Then one line on what is out of scope for v1.>

## §2 Decisions

<One `### <Decision>` per choice: the decision in one paragraph, then the line below. Settled
choices graduate to `docs/decisions.md`.>

Considered and not used: <option — why not>.

## §3 Rules

<Non-negotiables for any code in this project, beyond `docs/conventions.md`. One line each.>

## §4 Releases

Feature-complete or not shipped. No dates.

| Release | Ships | Gate to leave it |
| --- | --- | --- |
| R0 | <scope> | <the check that must pass> |

## §5 Next steps

<PR-sized steps in build order. Each: `### <n>. <title>` with what it changes and a DoD line.>

DoD: <the observable result and the command or check that proves it>.

## §6 Open

| Question | Default if unanswered | Needed by |
| --- | --- | --- |
| <question> | <what we do if nobody answers> | <the step it blocks> |
