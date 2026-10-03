import { UserAuthSchema } from '@temp-repo/studio-domain'
import { publicProcedure, router } from '../../init'

export const authQueries = router({
  me: publicProcedure.output(UserAuthSchema.nullable()).query(({ ctx }) => ctx.user),
})
