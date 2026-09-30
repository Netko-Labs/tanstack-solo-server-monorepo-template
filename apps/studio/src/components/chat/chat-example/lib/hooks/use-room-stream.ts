import { useEffect, useReducer } from 'react'
import { bindRealtimeSocket, trpcClient } from '@/integrations/trpc'
import type { RoomState } from '../types'
import { INITIAL_ROOM_STATE, roomIdentity, roomReducer } from '../utils'
import { useStatusReporter } from './use-status-reporter'

/** Subscribe = join, unsubscribe = leave. Resubscribes when the user or the room changes. */
export function useRoomStream(roomId: string, userId: string | undefined) {
  const [state, dispatch] = useReducer(roomReducer, INITIAL_ROOM_STATE)
  const identity = roomIdentity(roomId, userId)

  useEffect(() => {
    // The socket must not outlive the user it authenticated as.
    bindRealtimeSocket(userId)
    if (!userId) {
      dispatch({ type: 'reset', identity, connectionStatus: 'disconnected' })
      return
    }
    dispatch({ type: 'reset', identity, connectionStatus: 'connecting' })
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
  }, [roomId, userId, identity])

  // Presence status is this tab's call for its own connection; the server aggregates
  // across a user's tabs with active winning.
  useStatusReporter(roomId, state.identity === identity ? state.connectionId : undefined)

  // Never render the previous room/user's state during the switch, not even for a frame.
  if (state.identity !== identity) {
    const fresh: RoomState = {
      ...INITIAL_ROOM_STATE,
      identity,
      connectionStatus: userId ? 'connecting' : 'disconnected',
    }
    return fresh
  }
  return state
}
