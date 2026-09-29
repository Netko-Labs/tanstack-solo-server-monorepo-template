import { useEffect, useReducer } from 'react'
import { trpcClient } from '@/integrations/trpc'
import { INITIAL_ROOM_STATE, roomReducer } from '../utils'

/** Subscribe = join, unsubscribe = leave. Reconnects only when the user changes. */
export function useRoomStream(roomId: string, userId: string | undefined) {
  const [state, dispatch] = useReducer(roomReducer, INITIAL_ROOM_STATE)

  // biome-ignore lint/correctness/useExhaustiveDependencies: resubscribe only when the user changes
  useEffect(() => {
    if (!userId) {
      dispatch({ type: 'reset', connectionStatus: 'disconnected' })
      return
    }
    dispatch({ type: 'reset', connectionStatus: 'connecting' })
    const sub = trpcClient.room.stream.subscribe(
      { roomId },
      {
        onData: (event) => dispatch({ type: 'event', event }),
        onError: () => dispatch({ type: 'status', connectionStatus: 'disconnected' }),
        onConnectionStateChange: ({ state: link }) => {
          if (link === 'connecting') dispatch({ type: 'status', connectionStatus: 'connecting' })
          if (link === 'pending') dispatch({ type: 'status', connectionStatus: 'connected' })
        },
      },
    )
    return () => sub.unsubscribe()
  }, [userId])

  return state
}
