export class ResendApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(`resend request failed (${status}): ${detail}`)
    this.name = 'ResendApiError'
  }
}
