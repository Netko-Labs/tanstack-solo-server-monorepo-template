const PROBE_ORIGIN = 'http://n'

// URL parsing strips tab/LF/CR and reads `\` as `/`, so `/\t/evil.example` would leave the origin.
function isUnsafeChar(char: string) {
  const code = char.charCodeAt(0)
  return code <= 0x1f || code === 0x7f || char === '\\'
}

export function toRedirectPath(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/')) return undefined
  if ([...value].some(isUnsafeChar)) return undefined
  if (new URL(value, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return undefined
  return value
}
