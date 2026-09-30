import { useEffect, useRef } from 'react'
import type { VisibilityChangeHandler } from '../types'

/** Both directions of visibility; the handler is read through a ref so callers need no memo. */
export function useDocumentVisibility(handler: VisibilityChangeHandler, enabled = true) {
  const latest = useRef(handler)
  latest.current = handler

  useEffect(() => {
    if (!enabled) return

    const onVisibilityChange = () => latest.current(document.visibilityState === 'visible')

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [enabled])
}
