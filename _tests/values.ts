import type { TrpcProbes } from './types'

// Per app: a generated app has no procedures until it adds some, so it gets no tRPC probes.
export const TRPC_PROBES: Record<string, TrpcProbes> = {
  studio: {
    protectedQuery: 'todos.list',
    publicQuery: 'auth.me',
    guardedStream: 'room.stream',
    streamInput: { roomId: 'lobby' },
  },
}
