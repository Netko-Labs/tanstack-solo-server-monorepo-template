# RoomBus + hardening (plan.html, approved 2026-09-29)

One branch, one commit per item, one PR.

- [ ] 1 origin check on /trpc-ws upgrade (trustedOrigins + BASE_URL) → 403
- [ ] 2 /api/health 503 on db down; ws keepAlive 30s; chat hook no longer red on complete
- [ ] 3 RoomBus: Local + Redis (Bun RedisClient), presence hash + heartbeat 15s/TTL 45s, idle derived; RoomEventSchema; event-driven stream
- [ ] 4 index chat_message(created_at)
- [ ] 5 bun test task; bridge + bus tests; generator smoke job in CI
- [ ] 6 drop jwt/jwks/jose/shared-jwt, crypto+ENCRYPTION_KEY, cors, server/types, stale sample.env
- [ ] 7 todos owned: user_id FK, scoped queries/mutations
- [ ] 8 conventions: hooks split, auth.me public, logging debug, ui waivers
- [ ] verify: check-types, fmt-lint, bun test, dev WS (local + redis bus), prod bundle
