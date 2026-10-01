# Observability (code-whiskers)

Errors over the Sentry protocol; traces and logs over OTLP/HTTP JSON. Every signal is off until its
env is set, and with nothing set the app makes no telemetry calls and stdout stays as it was. The
code lives in `packages/shared/observability` (`/server`, `/client`, and a pure root for config
helpers); studio-config reads the env once into `studioEnvConfig.observability`.

## Turning it on

1. In code-whiskers, create a project and copy its DSN (`https://<public_key>@<host>/<projectId>`)
   and its public key.
2. In Coolify, set on the application:

   | Variable | Value | Build variable |
   | --- | --- | --- |
   | `SENTRY_DSN` | the DSN | no |
   | `VITE_SENTRY_DSN` | the DSN (browser; may equal `SENTRY_DSN`) | **yes** (the tunnel also reads it at runtime) |
   | `OTEL_EXPORTER_OTLP_ENDPOINT` | `https://<host>/otlp` (the exporters append `/v1/traces`, `/v1/logs`) | no |
   | `OTEL_EXPORTER_OTLP_HEADERS` | `x-codewhiskers-key=<public_key>` | no |
   | `SENTRY_ENVIRONMENT` | `staging` on staging (it runs `NODE_ENV=production`) | yes |

3. Enable Configuration → Advanced → **Include Source Commit in Build**, so `SOURCE_COMMIT` reaches
   the build and the browser events carry the release. Server release is `SENTRY_RELEASE`, else
   `SOURCE_COMMIT`, else `dev` (`releaseOf` in `packages/shared/observability/src/utils.ts`).
4. Deploy, then check `GET /api/health`: it reports `release` and `environment`. A production boot
   with no telemetry logs one `telemetry is off` warn.

Each signal is independent: `SENTRY_DSN` turns on server errors, `VITE_SENTRY_DSN` (at build)
browser errors, `OTEL_EXPORTER_OTLP_ENDPOINT` traces and logs. `assertProductionEnv` refuses a
malformed DSN and an OTLP endpoint without headers (every request would 401); it never requires
telemetry. `OTEL_SERVICE_NAME` (default `studio`) names the service; the SDK still reads its own
tuning knobs (`OTEL_BSP_*`, `OTEL_EXPORTER_OTLP_COMPRESSION=gzip`).

## Signal map

| Signal | Produced by | File |
| --- | --- | --- |
| Server error | tRPC `onError`, INTERNAL_SERVER_ERROR only, tagged `transport`/`trpc.path`, with the user id | `trpc/src/shared/error-report/`, wired in `routes/api/trpc/$.ts` and `server/trpc-ws.ts` |
| Server error | Server-route throws (not redirect/notFound) | `start.ts` request middleware |
| Server error | Server-function throws | `start.ts` function middleware |
| Server error | Uncaught exceptions and rejections | Sentry's default process handlers |
| Browser error | Route loader/render errors, global errors, query/mutation errors the server never answered | `router.tsx` `defaultOnCatch`, `integrations/observability/`, the QueryClient caches |
| Trace span | `METHOD /path` per request (not `/api/health`, `/api/monitor`) | `start.ts` |
| Trace span | `trpc.{type} {path}` per procedure, outermost middleware | `trpc/src/init.ts` |
| Trace span | better-auth's own spans (`handler /get-session`, `db findOne session`, plugin hooks), through the global tracer | better-auth itself |
| Log record | Every pino line at `info`+ while OTLP is on | `server/plugins/observability.ts` → `createOtlpLogStream` |

Browser events go to `POST /api/monitor`, which forwards an envelope only to an allowed DSN
(`SENTRY_DSN`, `VITE_SENTRY_DSN`) and caps bodies at 1 MiB; it answers 404 when no DSN is set. With
`VITE_SENTRY_DSN` unset at build, the browser bundle holds no SDK bytes.

code-whiskers keeps only `event` envelope items: sessions, client reports and transactions are
dropped, so the SDKs are configured not to send them. Of the OTLP resource it reads only
`service.name`; release and environment are stamped on every span and log record instead.

## Correlation

One trace id appears in three places: the stdout JSON line (`trace_id`/`span_id`, only while a span
is active), the OTLP log record (`traceId`) and the error event (`contexts.trace.trace_id`, also a
`trace_id` tag). That is how the code-whiskers issue page lists an event's logs.

## Adding spans

```ts
import { withSpan } from '@temp-repo/observability/server'

await withSpan('room.replay', { 'room.id': roomId }, async (span) => { /* … */ })
```

There is no auto-instrumentation: Nitro bundles dependencies into `.output/server/_libs`, where
require-hooks never see them. Libraries that call the OpenTelemetry API themselves still report
(better-auth does). Name spans by operation, never by id (`room.replay`, not
`room.lobby`); put ids in attributes.

## Rules

- Capture only INTERNAL_SERVER_ERROR; every other tRPC code is a client mistake or an expected
  refusal. `reportError` dedupes per error object and reports the innermost cause.
- Never log or attach query values, tokens, emails or Drizzle wrapper messages (they carry SQL
  params). Log `rootCause(error)`; spans never record exceptions.
- Never widen the tunnel past the DSN allow-list and the body cap: it is an unauthenticated
  forwarder.
- Keep span names low-cardinality.
- Flush only inside `shutdown.ts`'s `close` hook, last, bounded by `FLUSH_TIMEOUT_MS` (2 s). The
  observability plugin registers no `close` hook: hooks run in order, and it would flush before the
  room drain.

## Local testing

Point the env at a local code-whiskers. Its Sentry ingest creates an unknown project id on first
use in dev; OTLP does not, so `/otlp` answers 401 until the project exists (send one error event
with that key first). The package tests run the real SDKs against an in-process sink:
`bun test` in `packages/shared/observability` (`server/_tests/init.test.ts`, `server/_tests/tunnel.test.ts`).
Tests never receive telemetry env (`turbo.json` does not pass it).

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| OTLP 401 | Wrong key in `OTEL_EXPORTER_OTLP_HEADERS`, or the project does not exist yet |
| OTLP 415 | A protobuf exporter is in use; this package always uses the JSON ones |
| OTLP 413 | Batches over code-whiskers' 5 MB cap: lower `OTEL_BSP_MAX_EXPORT_BATCH_SIZE` |
| Browser events 403 at `/api/monitor` | The bundle's `VITE_SENTRY_DSN` is not in the runtime allow-list; set it at runtime too |
| Release is `dev` | `SOURCE_COMMIT` missing: check `/api/health` and the Coolify build toggle |
| Staging shows as production | `SENTRY_ENVIRONMENT` unset (staging runs `NODE_ENV=production`) |
