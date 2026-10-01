import { z } from 'zod'

const SocialProviderSchema = z.object({
  enabled: z.boolean(),
  clientId: z.string(),
  clientSecret: z.string(),
})

const dropIncompleteProvider = (provider: z.infer<typeof SocialProviderSchema>) =>
  provider.clientId && provider.clientSecret ? provider : undefined

const OptionalSocialProviderSchema =
  SocialProviderSchema.transform(dropIncompleteProvider).optional()

export const StudioConfigSchema = z.object({
  app: z.object({
    dev: z.boolean().default(false),
    port: z.number().default(3000),
    baseUrl: z.string().url(),
  }),
  cache: z.object({
    url: z.string(),
  }),
  db: z.object({
    url: z.string(),
  }),
  auth: z.object({
    secret: z.string().optional(),
    emailAndPassword: z.object({
      enabled: z.boolean(),
    }),
    trustedOrigins: z.array(z.string()).default(['http://localhost:3000', 'http://localhost:5173']),
    socialProviders: z.object({
      github: OptionalSocialProviderSchema,
      google: OptionalSocialProviderSchema,
      discord: OptionalSocialProviderSchema,
    }),
  }),
})
export type StudioConfig = z.infer<typeof StudioConfigSchema>
