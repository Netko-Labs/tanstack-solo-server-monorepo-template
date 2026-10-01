import { DEFAULT_RELEASE } from './constants'
import type { EnvRecord } from './types'

export const releaseOf = (env: EnvRecord): string =>
  env.SENTRY_RELEASE || env.SOURCE_COMMIT || DEFAULT_RELEASE

/** Staging runs with NODE_ENV=production, so it must set SENTRY_ENVIRONMENT. */
export const environmentOf = (env: EnvRecord): string =>
  env.SENTRY_ENVIRONMENT || (env.NODE_ENV === 'production' ? 'production' : 'development')

/** `http(s)://<public key>@<host>/<project id>`, the shape every Sentry SDK accepts. */
export function isValidDsn(dsn: string): boolean {
  try {
    const url = new URL(dsn)
    const isHttp = url.protocol === 'https:' || url.protocol === 'http:'
    return isHttp && url.username !== '' && /\/\d+$/.test(url.pathname)
  } catch {
    return false
  }
}

/** The OTEL_EXPORTER_OTLP_HEADERS format: `k=v,k2=v2`, values URL-encoded. */
export function parseOtlpHeaders(value: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const pair of value?.split(',') ?? []) {
    const separator = pair.indexOf('=')
    if (separator <= 0) continue
    const key = pair.slice(0, separator).trim()
    const raw = pair.slice(separator + 1).trim()
    if (!key || !raw) continue
    try {
      headers[key] = decodeURIComponent(raw)
    } catch {
      headers[key] = raw
    }
  }
  return headers
}
