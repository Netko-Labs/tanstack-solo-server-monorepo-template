# Collapse to one app: studio owns the tRPC WebSocket

Goal: drop `apps/realtime` + `packages/realtime/*`; studio serves `/trpc-ws` (crossws via Nitro) in
dev and in the Railpack/Coolify build. Same-origin cookie session replaces the JWT/JWKS dance.

- [x] Spike: Nitro `experimental.websocket` + `handlers: [{ route: '/trpc-ws' }]` echo works in dev
- [x] domain: chat + todo tables/entities, room schemas → `packages/studio/domain`
- [x] repository: migration 0002 (chat_message, todo)
- [x] service: chat/todos queries+mutations, `room/room-hub`
- [x] trpc: `todos` + `room` routers, `createWSContext`, crossws↔tRPC bridge (`ws/`)
- [x] app: `src/server/trpc-ws.ts` handler, vite nitro config, client `splitLink` (ws for subscriptions)
- [x] app: chat + todos hooks/types off `realtime-*`, drop `integrations/realtime`
- [x] remove: apps/realtime, packages/realtime/*, realtime-config, workspace entry, generator template + type prompt, CLI `getAppKind`
- [x] generator app-tanstack: mirror WS wiring (vite config, server handler, client links)
- [x] docs: CLAUDE.md, README (architecture, commands, Coolify single app), sample.env
- [x] verify: check-types, fmt-lint, dev WS chat in browser, prod build boots and serves WS
