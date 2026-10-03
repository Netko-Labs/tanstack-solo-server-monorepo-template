import { z } from 'zod'

export const UserAuthSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type UserAuth = z.infer<typeof UserAuthSchema>

export const SessionAuthSchema = z.object({
  id: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type SessionAuth = z.infer<typeof SessionAuthSchema>

/** The signed-in user as route data carries it; never the whole better-auth record. */
export const SessionUserSchema = UserAuthSchema.pick({
  id: true,
  name: true,
  email: true,
  image: true,
})
export type SessionUser = z.infer<typeof SessionUserSchema>

export const SignInEmailSchema = z.object({ email: z.string().trim().email() })
export type SignInEmail = z.infer<typeof SignInEmailSchema>
