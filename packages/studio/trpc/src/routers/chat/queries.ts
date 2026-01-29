import { getChatMessages } from '@temp-repo/studio-service'
import { publicProcedure, router } from '../../init'

export const chatQueries = router({
  messages: publicProcedure.query(async () => getChatMessages()),
})
