# Room bus

Presence + live chat for `room.stream`. One process → `LocalRoomBus`; `CACHE_URL` set →
`RedisRoomBus`, which makes every instance see the same room.

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
  yields `sync`. Anything queued before that point is deduped against the snapshot (joins of listed
  users, chats already in history). Anything after passes untouched.
- **Heartbeat never overlaps and never lands after leave.** One in flight at a time; cleanup awaits
  it before leaving. Heartbeat only writes the record if it is missing, so a client-set status is
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

## Dev gotcha

`hub` is a `globalThis` singleton because Vite evaluates the HTTP route (`ssr` env) and the
WebSocket handler (`nitro` env) as separate module graphs. On HMR the module's `dispose` closes and
drops it so the re-evaluated code builds a new one; if a hub change ever seems ignored, restart
`bun run repo dev --app studio`.
