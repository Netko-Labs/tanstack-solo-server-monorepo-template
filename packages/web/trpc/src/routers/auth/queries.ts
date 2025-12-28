import { webEnvConfig } from '@temp-repo/web-config'
import { protectedProcedure, publicProcedure, router } from '../../init'

export const authQueries = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user
  }),
  getEnabledAuthMethods: publicProcedure.query(async (_) => {
    return Object.entries(webEnvConfig.auth.socialProviders)
      .filter(([_, value]) => value?.enabled)
      .map(([key]) => key)
  }),
})
