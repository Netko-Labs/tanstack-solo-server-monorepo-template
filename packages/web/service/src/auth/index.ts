import { passkey } from '@better-auth/passkey'
import { webEnvConfig } from '@temp-repo/web-config'
import { account, jwks, session, user, verification } from '@temp-repo/web-domain'
import { db } from '@temp-repo/web-repository'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { jwt, lastLoginMethod, magicLink } from 'better-auth/plugins'

export const auth = betterAuth({
  appName: 'Web',
  baseURL: webEnvConfig.app.baseUrl,
  basePath: '/api/auth',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      account,
      verification,
      passkey,
      jwks,
    },
  }),
  advanced: {
    cookiePrefix: 'web',
  },
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github', 'discord'],
    },
  },
  plugins: [
    jwt({
      jwt: {
        expirationTime: '1d',
      },
    }),
    passkey(),
    magicLink({
      sendMagicLink: async ({ email, token, url }, _request) => {
        console.log('sendMagicLink', email, token, url)
      },
    }),
    lastLoginMethod(),
  ],
  ...webEnvConfig.auth,
})
