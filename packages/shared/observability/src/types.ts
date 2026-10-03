export type EnvRecord = Record<string, string | undefined>

export interface OtlpConfig {
  endpoint: string
  headers: Record<string, string>
}

/** Each signal is off unless its config is present: errors need `dsn`, traces and logs `otlp`. */
export interface ServerTelemetryConfig {
  serviceName: string
  release: string
  environment: string
  dsn?: string
  otlp?: OtlpConfig
}

export interface BrowserTelemetryConfig {
  dsn: string
  release: string
  environment: string
  tunnel?: string
}

export interface ErrorScope {
  tags?: Record<string, string>
  userId?: string
}

export interface TunnelOptions {
  allowedDsns: readonly string[]
  maxBytes?: number
}

export type SpanAttributes = Record<string, string | number | boolean>

export interface SpanHandle {
  setAttribute(key: string, value: string | number | boolean): void
  fail(): void
}

export interface LogLineStream {
  write(line: string): void
}
