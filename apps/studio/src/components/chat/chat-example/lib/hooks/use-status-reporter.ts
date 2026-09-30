import type { Member } from '@temp-repo/studio-domain'
import { useEffect, useRef } from 'react'
import { trpcClient } from '@/integrations/trpc'
import { useDocumentVisibility } from '@/shared/dom-events'
import type { StatusReporterState } from '../types'

const visibleStatus = (): Member['status'] =>
  document.visibilityState === 'visible' ? 'active' : 'idle'

/**
 * Reports this tab's status for its own connection: the current visibility once the
 * connection is known, then every change. Sends are serialized and coalesced to the
 * latest value; a failed send is not retried (the next change or connection will), and
 * nothing is sent for a connection that is gone.
 */
export function useStatusReporter(roomId: string, connectionId: string | undefined) {
  const state = useRef<StatusReporterState>({ inFlight: false, cancelled: false })

  const report = (status: Member['status']) => {
    if (!connectionId) return
    const s = state.current
    s.latest = status
    if (s.inFlight) return
    const send = async (): Promise<void> => {
      const next = s.latest
      if (s.cancelled || next === undefined || next === s.sent) return
      s.inFlight = true
      try {
        await trpcClient.room.setStatus.mutate({ roomId, connectionId, status: next })
        s.sent = next
      } catch {
        return
      } finally {
        s.inFlight = false
      }
      if (!s.cancelled && s.latest !== s.sent) await send()
    }
    void send()
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: report only changes with connectionId
  useEffect(() => {
    const own: StatusReporterState = { inFlight: false, cancelled: false }
    state.current = own
    if (connectionId) report(visibleStatus())
    return () => {
      own.cancelled = true
    }
  }, [connectionId])

  useDocumentVisibility((visible) => report(visible ? 'active' : 'idle'), Boolean(connectionId))
}
