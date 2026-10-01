import { environmentOf, isValidDsn, parseOtlpHeaders, releaseOf } from '@temp-repo/observability'
import { type StudioConfig, StudioConfigSchema } from '@temp-repo/studio-domain'

const splitList = (value: string | undefined): string[] =>
  value
    ?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) ?? []

const isEnabled = (args: (string | undefined)[]): boolean => {
  return args.every((arg) => arg !== undefined && arg !== '')
}

const MIN_AUTH_SECRET_LENGTH = 32

// Telemetry is never required, but a set-and-broken value would fail silently on every event.
function assertTelemetryEnv(env: NodeJS.ProcessEnv): void {
  for (const name of ['SENTRY_DSN', 'VITE_SENTRY_DSN']) {
    const dsn = env[name]
    if (dsn && !isValidDsn(dsn)) throw new Error(`${name} must look like https://<key>@<host>/<id>`)
  }
  if (env.OTEL_EXPORTER_OTLP_ENDPOINT && !env.OTEL_EXPORTER_OTLP_HEADERS) {
    throw new Error(
      'OTEL_EXPORTER_OTLP_ENDPOINT needs OTEL_EXPORTER_OTLP_HEADERS (the project key)',
    )
  }
}

// A production boot without its public URL, database, secret or mail delivery is a
// misconfiguration that must fail loudly, not serve.
export function assertProductionEnv(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return
  const missing = ['BASE_URL', 'DATABASE_URL', 'AUTH_SECRET', 'RESEND_API_KEY'].filter(
    (name) => !env[name],
  )
  if (missing.length > 0) throw new Error(`production requires ${missing.join(', ')}`)
  if ((env.AUTH_SECRET?.length ?? 0) < MIN_AUTH_SECRET_LENGTH) {
    throw new Error(`AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters`)
  }
  assertTelemetryEnv(env)
}
assertProductionEnv()

const studioConfig: StudioConfig = {
  app: {
    dev: process.env.NODE_ENV !== 'production',
    baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
    port: Number(process.env.PORT ?? 3000),
    trustedProxies: splitList(process.env.TRUSTED_PROXIES),
  },
  cache: {
    url: process.env.CACHE_URL ?? '',
  },
  db: {
    url: process.env.DATABASE_URL ?? '',
  },
  email: {
    from: process.env.EMAIL_FROM || 'Studio <onboarding@resend.dev>',
    resend: process.env.RESEND_API_KEY ? { apiKey: process.env.RESEND_API_KEY } : undefined,
  },
  observability: {
    serviceName: process.env.OTEL_SERVICE_NAME || 'studio',
    release: releaseOf(process.env),
    environment: environmentOf(process.env),
    dsn: process.env.SENTRY_DSN || undefined,
    tunnelDsns: [process.env.SENTRY_DSN, process.env.VITE_SENTRY_DSN].filter((dsn): dsn is string =>
      Boolean(dsn),
    ),
    otlp: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      ? {
          endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
          headers: parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
        }
      : undefined,
  },
  auth: {
    secret: process.env.AUTH_SECRET,
    emailAndPassword: {
      enabled: false,
    },
    trustedOrigins: splitList(process.env.TRUSTED_ORIGINS),
    socialProviders: {
      github: {
        enabled: isEnabled([process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET]),
        clientId: process.env.GITHUB_CLIENT_ID ?? '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      },
      google: {
        enabled: isEnabled([process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET]),
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      },
      discord: {
        enabled: isEnabled([process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET]),
        clientId: process.env.DISCORD_CLIENT_ID ?? '',
        clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
      },
    },
  },
}

export const studioEnvConfig = StudioConfigSchema.parse(studioConfig)
