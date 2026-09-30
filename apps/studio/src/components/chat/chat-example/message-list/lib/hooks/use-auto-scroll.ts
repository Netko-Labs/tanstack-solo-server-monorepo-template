import { useEffect, useRef } from 'react'
import { NEAR_BOTTOM_PX } from '../constants'

/** Keeps the list pinned to the newest message unless the reader has scrolled up. */
export function useAutoScroll(count: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pinned = useRef(true)

  // Pinned-ness is sampled on scroll, before a new message grows the list, so a tall
  // message cannot read as "the reader scrolled up".
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when the count changes
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (pinned.current) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    const onScroll = () => {
      pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [count])

  return containerRef
}
