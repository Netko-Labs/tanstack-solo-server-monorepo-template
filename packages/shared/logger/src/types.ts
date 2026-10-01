import type { MultiStreamRes } from 'pino'

export interface RootCause {
  message: string
  code?: string
}

export type GlobalLogStreams = typeof globalThis & Record<symbol, MultiStreamRes | undefined>
