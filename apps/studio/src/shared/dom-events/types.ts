import type { RefObject } from 'react'

export type VisibilityChangeHandler = (visible: boolean) => void

export type ScrollTarget = RefObject<HTMLElement | null>
