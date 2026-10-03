import { displayName, RoomStreamInputSchema } from '@temp-repo/studio-domain'
import { hub } from '@temp-repo/studio-service'
import { protectedProcedure, router } from '../../init'

/** History arrives with the stream's `sync`; subscribe = join, unsubscribe or disconnect = leave. */
export const roomSubscriptions = router({
  stream: protectedProcedure
    .input(RoomStreamInputSchema)
    .subscription(({ ctx, input, signal }) =>
      hub.stream(
        input.roomId,
        { userId: ctx.user.id, name: displayName(ctx.user), status: 'active' },
        signal,
        ctx.session.expiresAt,
      ),
    ),
})
