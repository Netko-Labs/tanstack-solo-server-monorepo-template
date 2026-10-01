import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { auth } from '../../../auth'
import { getSessionUser } from '../get-session-user'

afterEach(() => mock.restore())

describe('getSessionUser', () => {
  test('projects the better-auth user onto SessionUser', async () => {
    const now = new Date()
    const user = { id: 'u', name: 'U', email: 'u@example.com', image: null }
    spyOn(auth.api, 'getSession').mockResolvedValue({
      user: { ...user, emailVerified: true, createdAt: now, updatedAt: now },
      session: { id: 's', userId: 'u', token: 't', expiresAt: now, createdAt: now, updatedAt: now },
    } as never)
    expect(await getSessionUser(new Headers())).toStrictEqual(user)
  })

  test('is null without a session', async () => {
    spyOn(auth.api, 'getSession').mockResolvedValue(null as never)
    expect(await getSessionUser(new Headers())).toBeNull()
  })
})
