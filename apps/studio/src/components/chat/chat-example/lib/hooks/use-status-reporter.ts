import type { Member } from '@temp-repo/studio-domain'
import { useEffect, useRef } from 'react'
import { trpcClient } from '@/integrations/trpc'
import { useDocumentVisibility } from '@/shared/dom-events'
import type { StatusReporterState } from '../types'

const visibleStatus = (): Member['status'] =>
  document.visibilityState === 'visible' ? 'active' : 'idle'

/** Serialized, coalesced to the latest value; a failed value is not retried, a newer one still goes. */
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
        // Leave `sent` as is: the failed value is dropped, the comparison below sends a newer one.
      } finally {
        s.inFlight = false
      }
      if (!s.cancelled && s.latest !== next) await send()
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
