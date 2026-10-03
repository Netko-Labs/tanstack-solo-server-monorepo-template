import type { MultiStreamRes } from 'pino'

export interface RootCause {
  message: string
  code?: string
}

/** snake_case, as the error events name the same ids, so one grep finds both. */
export type TraceIds = Partial<Record<'trace_id' | 'span_id', string>>

export type GlobalLogStreams = typeof globalThis & Record<symbol, MultiStreamRes | undefined>
