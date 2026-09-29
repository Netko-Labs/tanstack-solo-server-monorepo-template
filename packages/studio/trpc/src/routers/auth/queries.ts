import { studioEnvConfig } from '@temp-repo/studio-config'
import { publicProcedure, router } from '../../init'

export const authQueries = router({
  me: publicProcedure.query(async ({ ctx }) => ctx.user),
  getEnabledAuthMethods: publicProcedure.query(async (_) => {
    return Object.entries(studioEnvConfig.auth.socialProviders)
      .filter(([_, value]) => value?.enabled)
      .map(([key]) => key)
  }),
})
