import { MONITOR_PATH } from './constants'
import type { BrowserTelemetry } from './types'
import { isReportableQueryError } from './utils'

let telemetry: Promise<BrowserTelemetry | undefined> | undefined

// Unset at build, the import is dead code: the SDK ships zero bytes. A blocked chunk is ignored.
function loadTelemetry(): Promise<BrowserTelemetry | undefined> | undefined {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (import.meta.env.SSR || !dsn) return undefined
  telemetry ??= import('@temp-repo/observability/client')
    .then((module) => {
      module.initBrowserTelemetry({
        dsn,
        tunnel: MONITOR_PATH,
        release: import.meta.env.VITE_RELEASE,
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
      })
      return module
    })
    .catch(() => undefined)
  return telemetry
}

/** Before hydration, so the SDK's global handlers see the earliest errors. */
export function startBrowserTelemetry(): void {
  void loadTelemetry()
}

export function reportClientError(error: unknown): void {
  void loadTelemetry()?.then((module) => module?.captureBrowserError(error))
}

export function reportQueryError(error: unknown): void {
  if (isReportableQueryError(error)) reportClientError(error)
}
