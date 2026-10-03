import { studioEnvConfig } from '@temp-repo/studio-config'
import { account, session, user, verification } from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { lastLoginMethod, magicLink } from 'better-auth/plugins'
import { sendMagicLinkEmail } from '../email'
import { betterAuthLogger } from '../logger'

const { trustedProxies } = studioEnvConfig.app

export const auth = betterAuth({
  appName: 'Studio',
  baseURL: studioEnvConfig.app.baseUrl,
  basePath: '/api/auth',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  advanced: {
    cookiePrefix: 'studio',
    ipAddress: trustedProxies.length > 0 ? { trustedProxies } : undefined,
  },
  logger: betterAuthLogger,
  rateLimit: {
    enabled: !studioEnvConfig.app.dev,
  },
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
    },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 10, // 10 minutes
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ email, url })
      },
    }),
    lastLoginMethod(),
  ],
  ...studioEnvConfig.auth,
})
