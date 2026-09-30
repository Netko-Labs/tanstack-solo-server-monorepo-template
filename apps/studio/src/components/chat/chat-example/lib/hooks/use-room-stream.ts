import { useEffect, useReducer } from 'react'
import { trpcClient } from '@/integrations/trpc'
import { INITIAL_ROOM_STATE, roomReducer } from '../utils'

/** Subscribe = join, unsubscribe = leave. Resubscribes when the user or the room changes. */
export function useRoomStream(roomId: string, userId: string | undefined) {
  const [state, dispatch] = useReducer(roomReducer, INITIAL_ROOM_STATE)

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
  }, [roomId, userId])

  return state
}
