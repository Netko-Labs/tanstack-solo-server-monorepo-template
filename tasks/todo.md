# Audit hardening (branch feat/audit-hardening, from audit-plan.html, approved 2026-09-30)

Decisions: A migrate on container start · B handle = email local part · C delete room.messages · D roomId pattern

- [x] 1 deploy: migrate in startCommand, aptPackages curl, CI="" + SERVER_SHUTDOWN_TIMEOUT, nitro close hook (peers 1001 → leaves → bus/db close), resilient Redis client, redis ping in health, prod config fail-fast, CI builds
- [x] 2 security: drop room.messages, handle instead of email, ws closes on identity change + session expiry deadline, magic-link logging/Resend errors, query keys only in request log, error formatter (root cause, 4xx at debug), roomId pattern, per-peer subscription cap, members hash EXPIRE
- [x] 3 correctness: room_id + migration 0004, status reporter no hot loop, chat send via mutation + loading, todos errors/gate/patch refine/limits, partial resubscribe failure, guest chat view
- [x] 4 tests: real-redis CLIENT KILL, procedure auth table, todo ownership (postgres in CI), heartbeat fake timers, hub-vs-bus import, turbo transit, studio test script + reducer test
- [x] 5 dx: migrator guard, CLI (test filter, db:seed, reset, -a), serve port cleanup, README first run + dev .env fail-fast, root compose removal, clean via glob, template deps + health route, CI commitlint pin + caches
- [x] 6 polish: a11y, SSR query client, barrels/conventions, dead exports + passkey table, ops hygiene (db singleton, health log skip, kawaii off in prod, trustedProxies), docs drift
- [x] verify: check-types, lint, tests (redis + postgres), prod bundle boot with SIGTERM, generator build, PR
