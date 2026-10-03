// Browsers send Origin in canonical form (lowercase host, default port dropped, no path);
// compare configured entries the same way.
function canonicalOrigin(value: string): string | undefined {
  try {
    return new URL(value).origin
  } catch {
    return undefined
  }
}

export function isTrustedOrigin(origin: string, trusted: readonly string[]): boolean {
  const target = canonicalOrigin(origin)
  return target !== undefined && trusted.some((entry) => canonicalOrigin(entry) === target)
}
