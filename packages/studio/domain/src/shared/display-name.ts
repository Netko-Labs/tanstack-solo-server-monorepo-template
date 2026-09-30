/** Never the email: magic-link users have no name, so fall back to the local part. */
export function displayName(user: { name?: string | null; email: string }): string {
  const name = user.name?.trim()
  if (name) return name
  return user.email.split('@')[0] || 'anonymous'
}
