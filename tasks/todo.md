# WS flawless (branch feat/ws-flawless)

- [x] Redis restart: subscriptions restored on reconnect, fresh sync per stream, single delivery
- [x] client-driven status (tab visibility → room.setStatus), server-side idle inference removed
- [x] bus is the process singleton; hub hot-reloads (verified live)
- [x] docs/room-bus.md; README upgrade warning; CLAUDE.md pointer
- [x] dead code: auth.getEnabledAuthMethods, test:e2e CLI command
- [x] verified: Redis restart under a live socket, two prod instances on one Redis, server restart under a browser tab
