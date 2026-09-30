import { z } from 'zod'

const _protoSocialProviderSchema = z.object({
  enabled: z.boolean(),
  clientId: z.string(),
  clientSecret: z.string(),
})

const transformSocialProviderSchema = (data: z.infer<typeof _protoSocialProviderSchema>) => {
  if (!data.clientId || !data.clientSecret) {
    return undefined
  }
  return data
}

const _protoStudioConfigSchema = z.object({
  app: z.object({
    dev: z.boolean().default(false),
    port: z.number().default(3000),
    baseUrl: z.string().url(),
  }),
  cache: z.object({
    url: z.string(),
  }),
  db: z.object({
    url: z.string().min(1),
  }),
  auth: z.object({
    secret: z.string().optional(),
    emailAndPassword: z.object({
      enabled: z.boolean(),
    }),
    trustedOrigins: z.array(z.string()).default(['http://localhost:3000', 'http://localhost:5173']),
    socialProviders: z.object({
      github: _protoSocialProviderSchema.transform(transformSocialProviderSchema).optional(),
      google: _protoSocialProviderSchema.transform(transformSocialProviderSchema).optional(),
      discord: _protoSocialProviderSchema.transform(transformSocialProviderSchema).optional(),
    }),
  }),
})

export const StudioConfigSchema = _protoStudioConfigSchema
export type StudioConfig = z.infer<typeof StudioConfigSchema>
