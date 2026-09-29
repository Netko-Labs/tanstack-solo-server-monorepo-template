import { useEffect, useRef } from 'react'
import { scrollIntoView } from '@/shared/dom-events'

/** Keeps the anchor in view whenever the tracked count grows. */
export function useAutoScroll(count: number) {
  const anchorRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when the count changes
  useEffect(() => {
    scrollIntoView(anchorRef, { behavior: 'smooth' })
  }, [count])

  return anchorRef
}
