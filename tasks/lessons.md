# Lessons

Failure modes and the rule that prevents them. Short, current, one entry per correction.

## Tooling

- **The nitro patch key is the exact nitro version.** Bumping nitro without renaming
  `patches/nitro@<version>.patch` and its `patchedDependencies` key drops the patch: `bun install`
  exits 0 with no warning, then every request answers 500 with
  `[crossws] Using Node.js adapter in an incompatible environment`. Found 2026-10-01 in the freeze
  audit. Check: `bun run repo check:nitro-patch --app studio` (`serve` and CI run it).
- **turbo writes its block back into `AGENTS.md`.** Deleting the file or the managed block does not
  stick; turbo re-adds it before repository commands when it detects an agent. Keep house content
  outside the block. Found 2026-10-01 in the freeze audit.
- **JSX double braces in a `.hbs` template are mustaches.** `config={{ … }}` failed to parse and
  aborted every package after `apps/{name}`; write `config=\{{ … }}`. Found 2026-09-30 in #14
  (`root-devtools.tsx.hbs`). Check: the CI generator job scaffolds an app and typechecks it.
- **A template ends in exactly one newline.** 31 templates had a double trailing newline, so every
  generated app failed the formatter. Found 2026-09-30 in #14. Check: `fmt-lint` on a generated
  tree.
- **Never `import { RedisClient } from 'bun'` in a package the client graph can reach.** Vite's
  dependency scanner chokes on the `bun` specifier; use the global `Bun.RedisClient`. Found
  2026-09-30 in #14 (`repository/src/cache/client.ts`).

## Deploy

- **Coolify's pre-deployment command runs in the previous container.** It applied the last
  deploy's migrations, before the new image existed. Migrate in `railpack.json`'s `startCommand`
  and write migrations expand/contract. Found 2026-09-30 in #16.
- **Railpack's runtime image has no `curl`.** Coolify's HTTP healthcheck could never pass. Keep
  `deploy.aptPackages: ["curl"]`. Found 2026-09-30 in #16.
- **Railpack sets `CI=true` at runtime, which turns off srvx's SIGTERM drain.** Deploys cut live
  sockets. Keep `deploy.variables.CI: ""` and `SERVER_SHUTDOWN_TIMEOUT`. Found 2026-09-30 in #16.
- **An app with no migrations must still start.** The build skipped the migrator for such apps, so
  a generated app's `startCommand` failed; the migrator is always bundled and no-ops without a
  journal. Found 2026-09-30 in #16.

## Realtime

- **Bun's Redis client reconnects but does not re-`SUBSCRIBE`, and keeps the old listener.** After
  an outage the bus went silent; a plain re-subscribe then delivered every message twice. The bus
  keeps its own subscription table and drops the listener before restoring. Found 2026-09-30 in
  #15. Check: `redis-room-bus.test.ts` (CLIENT KILL, exactly one delivery; needs `CACHE_URL`).
- **Process singletons live on `globalThis`.** Vite evaluates the HTTP route and the WebSocket
  handler as two module graphs, which built two Postgres pools and would split room presence. Edits
  to a singleton's file (the room bus) need a dev restart. Found 2026-09-30 in #15 and #16.
- **A quiet socket is closed by the proxy.** Traefik's idle timeout dropped tabs that were only
  listening; the bridge sends tRPC keepalive pings. Found 2026-09-30 in #14.
- **Presence writes first, then counts, atomically.** Two tabs opening at once published two joins
  or none. Join and leave run as one Lua script each. Found 2026-09-30 in #14. Check:
  `redis-room-bus.test.ts` contract suite with `CACHE_URL` set.
- **A request reusing a live subscription id is refused.** A query error with a reused id freed
  another subscription's slot. Found 2026-09-30 in #16 (review rounds 3, 4 and 10).

## Security

- **Cookies ride cross-site WebSocket upgrades, and CORS never applies to sockets.** Cross-site
  WebSocket hijacking was live until the upgrade checked `Origin` against `BASE_URL` +
  `TRUSTED_ORIGINS`. Found 2026-09-30 in #14. Check: `ws/utils.test.ts` origin allow-list cases.
- **A public procedure that returns user rows leaks what they hold.** `room.messages` returned
  every author's email; authors are display names now. Found 2026-09-30 in #16. Check:
  `procedures.test.ts` public allow-list.
- **Dev-only output tests `NODE_ENV === 'development'`, never `!== 'production'`.** Magic links
  were logged when `NODE_ENV` was unset or `test`. Found 2026-09-30 in #16 (review round 9).
