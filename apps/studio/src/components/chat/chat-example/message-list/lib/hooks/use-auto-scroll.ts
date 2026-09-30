import { useEffect, useRef } from 'react'

/** Keeps the list pinned to the newest message unless the reader has scrolled up. */
export function useAutoScroll(count: number) {
  const containerRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when the count changes
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [count])

  return containerRef
}
