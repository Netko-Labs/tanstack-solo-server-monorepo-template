import { publicProcedure, router } from '../../init'

export const authQueries = router({
  me: publicProcedure.query(async ({ ctx }) => ctx.user),
})
