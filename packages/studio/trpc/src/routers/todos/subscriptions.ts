import { createLogger } from '@temp-repo/logger'
import { getTodos } from '@temp-repo/studio-service'
import { z } from 'zod'
import { publicProcedure, router } from '../../init'

const logger = createLogger('todos:subscriptions')

export const todosSubscriptions = router({
  /**
   * HTTP/SSE subscription for todo updates
   * Uses async generator pattern for Server-Sent Events
   * Polls for updates every 3 seconds
   */
  onUpdate: publicProcedure
    .input(z.object({ lastEventId: z.string().optional() }).optional())
    .subscription(async function* ({ signal }) {
      let eventId = 0

      logger.debug('Client subscribed to todo updates')

      try {
        // Send initial data
        const initialTodos = await getTodos()
        yield {
          id: String(eventId++),
          type: 'sync' as const,
          todos: initialTodos,
          timestamp: Date.now(),
        }

        // Poll for updates every 3 seconds
        while (!signal?.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 3000))

          if (signal?.aborted) break

          const todos = await getTodos()
          yield {
            id: String(eventId++),
            type: 'update' as const,
            todos,
            timestamp: Date.now(),
          }
        }
      } catch (error) {
        logger.error({ error }, 'Error in todo subscription')
        throw error
      } finally {
        logger.debug('Client unsubscribed from todo updates')
      }
    }),
})
