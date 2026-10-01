import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { user } from '@temp-repo/studio-domain'
import { db } from '@temp-repo/studio-repository'
import { handleOAuthUserInfo } from 'better-auth/oauth2'
import { eq } from 'drizzle-orm'
import { auth } from './auth'

const hasDb = Boolean(process.env.DATABASE_URL)
const id = `test-${crypto.randomUUID()}`
const email = `${id}@example.com`

describe.skipIf(!hasDb)('oauth account linking', () => {
  beforeAll(async () => {
    const now = new Date()
    await db
      .insert(user)
      .values({ id, name: id, email, emailVerified: true, createdAt: now, updatedAt: now })
  })
  afterAll(async () => {
    await db.delete(user).where(eq(user.id, id))
  })

  test('a provider profile with an unverified email is not linked to an existing user', async () => {
    for (const providerId of ['github', 'google', 'discord']) {
      const result = await handleOAuthUserInfo({ context: await auth.$context } as never, {
        userInfo: { id: `${providerId}-${id}`, name: id, email, emailVerified: false },
        account: { providerId, accountId: `${providerId}-${id}` },
      })
      expect(result).toMatchObject({ error: 'account not linked', data: null })
    }
  })
})
