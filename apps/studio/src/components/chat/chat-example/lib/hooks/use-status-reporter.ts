import type { Member } from '@temp-repo/studio-domain'
import { useEffect, useRef } from 'react'
import { trpcClient } from '@/integrations/trpc'
import { useDocumentVisibility } from '@/shared/dom-events'

const visibleStatus = (): Member['status'] =>
  document.visibilityState === 'visible' ? 'active' : 'idle'

/**
 * Reports this tab's status for its own connection: the current visibility once the
 * connection is known, then every change. Sends are serialized and coalesced to the
 * latest value, so a slow earlier request can never overwrite a newer one.
 */
export function useStatusReporter(roomId: string, connectionId: string | undefined) {
  const state = useRef<{ inFlight: boolean; latest?: Member['status']; sent?: Member['status'] }>({
    inFlight: false,
  })

  const report = (status: Member['status']) => {
    if (!connectionId) return
    const s = state.current
    s.latest = status
    if (s.inFlight) return
    const send = async (): Promise<void> => {
      const next = s.latest
      if (next === undefined || next === s.sent) return
      s.inFlight = true
      try {
        await trpcClient.room.setStatus.mutate({ roomId, connectionId, status: next })
        s.sent = next
      } catch {
        s.sent = undefined
      } finally {
        s.inFlight = false
      }
      if (s.latest !== s.sent) await send()
    }
    void send()
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: report only changes with connectionId
  useEffect(() => {
    state.current = { inFlight: false }
    if (connectionId) report(visibleStatus())
  }, [connectionId])

  useDocumentVisibility((visible) => report(visible ? 'active' : 'idle'), Boolean(connectionId))
}
