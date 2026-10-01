import type { RootCause } from './types'

/** The innermost `cause`: wrappers like drizzle's embed SQL params in their own message. */
export function rootCause(error: unknown): RootCause {
  let current = error
  while (current instanceof Error && current.cause instanceof Error) current = current.cause
  if (!(current instanceof Error)) return { message: String(current) }
  const code = 'code' in current && current.code !== undefined ? String(current.code) : undefined
  return { message: current.message, code }
}
