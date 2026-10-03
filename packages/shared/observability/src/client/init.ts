import * as Sentry from '@sentry/browser'
import type { BrowserTelemetryConfig } from '../types'
import { DROPPED_INTEGRATIONS } from './constants'

export function initBrowserTelemetry({
  dsn,
  release,
  environment,
  tunnel,
}: BrowserTelemetryConfig): void {
  Sentry.init({
    dsn,
    release,
    environment,
    tunnel,
    sendClientReports: false,
    integrations: (defaults) => defaults.filter(({ name }) => !DROPPED_INTEGRATIONS.has(name)),
  })
}

export function captureBrowserError(error: unknown): void {
  if (Sentry.getClient()) Sentry.captureException(error)
}
