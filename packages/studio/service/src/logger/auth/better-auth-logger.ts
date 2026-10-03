import { createLogger, rootCause } from '@temp-repo/logger'
import type { AuthLogger } from './types'

const authLogger = createLogger('auth')

// better-auth passes errors whose messages can embed SQL params, and arbitrary objects:
// keep the root cause of an error and the type name of anything that is not a primitive.
const safeArg = (arg: unknown) => {
  if (arg instanceof Error) return rootCause(arg)
  if (arg === null || typeof arg !== 'object') return arg
  return `[${arg.constructor?.name ?? 'object'}]`
}

export const betterAuthLogger: AuthLogger = {
  level: 'info',
  log: (level, message, ...args) => {
    authLogger[level](args.length ? { args: args.map(safeArg) } : {}, message.trim())
  },
}
