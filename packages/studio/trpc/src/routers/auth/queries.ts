import { studioEnvConfig } from '@temp-repo/studio-config'
import { protectedProcedure, publicProcedure, router } from '../../init'

export const authQueries = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user
  }),
  getEnabledAuthMethods: publicProcedure.query(async (_) => {
    return Object.entries(studioEnvConfig.auth.socialProviders)
      .filter(([_, value]) => value?.enabled)
      .map(([key]) => key)
  }),
})
