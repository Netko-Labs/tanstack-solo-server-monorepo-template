# Room bus

Presence + live chat for `room.stream`, in `packages/studio/service/src/room/`. One process →
`local/LocalRoomBus`; `CACHE_URL` set → `redis/RedisRoomBus` (Lua scripts in `redis/constants.ts`),
which makes every instance see the same room.

## Shapes

| thing | Redis | Local |
| --- | --- | --- |
| events | `PUBLISH room:{id}` (superjson, validated by `RoomEventSchema`) | `EventEmitter` |
| presence record | hash `room:{id}:members` field = connectionId, value = member JSON | `Map<connectionId, record>` |
| liveness | key `room:{id}:alive:{connectionId}`, `EX 45`, refreshed every 15 s | `lastSeen` timestamp |
| status | stored in the member JSON, set by the client (`room.setStatus`) | same |

A connection is one `room.stream` subscription. A user with two tabs is two connections; readers
collapse connections to one member per user (`active` beats `idle`).

## Invariants

- **Write first, decide after.** Join writes the record and then counts the user's live connections;
  it publishes `join` only when the count is 1. Leave deletes and then counts; `leave` only at 0.
  In Redis both run as one Lua script that also does the `PUBLISH`, so concurrent connections of
  the same user cannot both stay silent, and event order equals state order across instances.
- **Snapshot boundary.** `stream` subscribes, joins, loads history, then reads members *last* and
  yields `sync`. Joins queued before that point are dropped when the user is listed. A chat already
  in a snapshot is dropped for the stream's lifetime, since its notification may trail the history
  read. Everything else passes untouched. A bus reconnect queues a `resync` marker, so the fresh
  snapshot keeps queue order and the events behind it are deduped against it the same way.
- **Heartbeat never overlaps and never lands after leave.** One in flight at a time; cleanup awaits
  it before leaving. Heartbeat rewrites the record's details but keeps its stored status, so a client-set status is
  kept; pruning is a conditional delete (`EXISTS alive == 0 → HDEL`) so it cannot erase a refresh.
- **Expiry is silent by design.** A dead instance publishes nothing. Its connections expire after
  45 s and readers drop them; every subscriber's heartbeat tick diffs the membership signature and
  emits a `presence` snapshot when it changed, so a vanished user disappears everywhere within one
  interval.
- **Redis outage.** Bun's client reconnects but does not re-issue `SUBSCRIBE`. The bus keeps its own
  subscription table, restores it on the next `onconnect`, and fires `onReconnect`; the hub then
  pushes a fresh `sync` to every stream, because events published during the outage are gone.
  `room.send` persists to Postgres before publishing, so a lost publish loses a notification, not a
  message. Publish failures are logged and not rethrown: the message is already saved.
- **Restores never stack.** Restores of one channel run strictly in order, and one failed channel
  never stops the others. Only the first attempt is awaited; retries back off (capped) in the
  background for as long as the listener is wanted, because a deaf instance is never a steady
  state. A late success resyncs again, a newer restore supersedes pending retries (no callback is
  subscribed twice), and a listener dropped meanwhile is never restored.

## Dev gotcha

The bus is a `globalThis` singleton because Vite evaluates the HTTP route (`ssr` env) and the
WebSocket handler (`nitro` env) as separate module graphs, and both must share one set of
connections and presence. The hub is stateless and rebuilt on every module evaluation, so edits to
`room-hub.ts` hot-reload; edits to the bus files (`local/`, `redis/`, `create-room-bus.ts`,
`utils.ts`) keep serving the old instance until you restart `bun run repo dev --app studio`.
