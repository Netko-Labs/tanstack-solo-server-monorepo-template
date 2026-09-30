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

// A production boot without its public URL, database, secret or mail delivery is a
// misconfiguration that must fail loudly, not serve.
function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') return
  const missing = ['BASE_URL', 'DATABASE_URL', 'AUTH_SECRET', 'RESEND_API_KEY'].filter(
    (name) => !process.env[name],
  )
  if (missing.length > 0) throw new Error(`production requires ${missing.join(', ')}`)
  if ((process.env.AUTH_SECRET?.length ?? 0) < MIN_AUTH_SECRET_LENGTH) {
    throw new Error(`AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters`)
  }
}
assertProductionEnv()

const studioConfig: StudioConfig = {
  app: {
    dev: process.env.NODE_ENV !== 'production',
    baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
    port: Number(process.env.PORT ?? 3000),
  },
  cache: {
    url: process.env.CACHE_URL ?? '',
  },
  db: {
    url: process.env.DATABASE_URL ?? '',
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
