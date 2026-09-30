import { useEffect, useRef } from 'react'
import type { KeydownHandler, VisibilityChangeHandler, VisibilityHandler } from '../types'

export function useDocumentKeydown(handler: KeydownHandler, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
    }
  }, [enabled, handler])
}

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

export function useSyncOnVisible(handler: VisibilityHandler, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handler()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [enabled, handler])
}
