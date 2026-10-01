import type { GatedEnvName } from './types'

// '' skips the gated suite; under REQUIRE_GATED_SUITES (CI) a missing URL fails it instead.
export function gatedEnv(name: GatedEnvName): string {
  const value = process.env[name] ?? ''
  if (!value && process.env.REQUIRE_GATED_SUITES) {
    throw new Error(`${name} is unset while REQUIRE_GATED_SUITES is on: its suite would skip`)
  }
  return value
}
