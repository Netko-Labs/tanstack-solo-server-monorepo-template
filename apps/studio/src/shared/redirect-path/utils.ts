/** A same-origin path to return to after sign-in, or undefined for anything that could leave it. */
export function toRedirectPath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return undefined
  return value
}
