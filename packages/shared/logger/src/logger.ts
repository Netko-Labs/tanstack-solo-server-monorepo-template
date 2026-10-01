import pino, { type DestinationStream, type Level } from 'pino'
import pretty from 'pino-pretty'
import type { GlobalLogStreams } from './types'

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  brightMagenta: '\x1b[95m',
  whiteOnRed: '\x1b[41m\x1b[37m',
}

const KAWAII_PREFIXES: Record<string, string> = {
  fatal: '(;-;) ヤバイ!!',
  error: '(>_<) ダメ!',
  warn: '(・_・;) チョット...',
  info: '(◕‿◕) ヨシ!',
  debug: '(._.) ナルホド~',
  trace: '(*^ω^) ミッケ!',
}

const LEVEL_COLORS: Record<string, string> = {
  fatal: ANSI.whiteOnRed,
  error: ANSI.red,
  warn: ANSI.yellow,
  info: ANSI.cyan,
  debug: ANSI.magenta,
  trace: ANSI.gray,
}

const METHOD_COLORS: Record<string, string> = {
  GET: ANSI.green,
  POST: ANSI.blue,
  PUT: ANSI.yellow,
  PATCH: ANSI.yellow,
  DELETE: ANSI.red,
  HEAD: ANSI.gray,
  OPTIONS: ANSI.gray,
}

const STANDARD_KEYS = ['level', 'time', 'pid', 'hostname', 'msg', 'name', 'namespace']

const isDevelopment = process.env.NODE_ENV !== 'production'

const statusColor = (status: number): string => {
  if (status >= 500) return ANSI.red
  if (status >= 400) return ANSI.yellow
  if (status >= 300) return ANSI.cyan
  if (status >= 200) return ANSI.green
  return ANSI.gray
}

const durationColor = (ms: number): string => {
  if (ms < 100) return ANSI.green
  if (ms < 500) return ANSI.yellow
  return ANSI.red
}

function formatValue(key: string, value: unknown): string {
  if (key === 'duration' && typeof value === 'number') {
    return `${durationColor(value)}${value}ms${ANSI.reset}`
  }
  if (key === 'path' && typeof value === 'string') {
    return `${ANSI.brightMagenta}${value}${ANSI.reset}`
  }
  if (key === 'status' && typeof value === 'number') {
    return `${statusColor(value)}${value}${ANSI.reset}`
  }
  if (key === 'method' && typeof value === 'string') {
    const color = METHOD_COLORS[value.toUpperCase()] || ''
    return `${color}${value}${ANSI.reset}`
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }
  return String(value)
}

function toDate(timestamp: unknown): Date {
  let date: Date
  if (typeof timestamp === 'number') {
    date = new Date(timestamp)
  } else if (typeof timestamp === 'string') {
    const epoch = Number(timestamp)
    date = Number.isNaN(epoch) ? new Date(timestamp) : new Date(epoch)
  } else {
    date = new Date()
  }
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function createKawaiiPrettyStream() {
  return pretty({
    colorize: true,
    ignore: 'pid,hostname',
    messageFormat: (log, messageKey) => {
      const level = pino.levels.labels[log.level as number] || 'info'
      const prefix = KAWAII_PREFIXES[level] || '(・・)'
      const color = LEVEL_COLORS[level] || ''
      const msg = log[messageKey] as string

      let output = `${color}${ANSI.bright}${prefix}${ANSI.reset} ${msg}`
      const extraKeys = Object.keys(log).filter((k) => !STANDARD_KEYS.includes(k))
      if (extraKeys.length > 0) {
        const extras = extraKeys
          .map((key) => `${ANSI.dim}${key}=${ANSI.reset}${formatValue(key, log[key])}`)
          .join(' ')
        output += ` ${ANSI.dim}│${ANSI.reset} ${extras}`
      }
      return output
    },
    customPrettifiers: {
      time: (timestamp) => {
        const time = toDate(timestamp).toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        return `${ANSI.dim}[${time}]${ANSI.reset}`
      },
      level: (level) => {
        const levelName = pino.levels.labels[Number(level)] || 'info'
        const color = LEVEL_COLORS[levelName] || ''
        return `${color}${levelName.toUpperCase().padEnd(5)}${ANSI.reset}`
      },
    },
  })
}

// One multistream per process, not per module graph: Nitro bundles its plugins apart from the
// app, so a plugin's addLogStream must reach the app's loggers too.
const STREAMS_KEY = Symbol.for('temp-repo.logger.streams')
const globalStreams = globalThis as GlobalLogStreams
// Entries default to 'info'; 'trace' lets the logger's own level decide, so dev keeps debug lines.
globalStreams[STREAMS_KEY] ??= pino.multistream([
  { level: 'trace', stream: isDevelopment ? createKawaiiPrettyStream() : pino.destination(1) },
])
const streams = globalStreams[STREAMS_KEY]

/** Development: pretty and debug level. Production: plain JSON at info level for log shippers. */
export const logger = pino(
  { level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info') },
  streams,
)

export const createLogger = (namespace: string) => logger.child({ namespace: `[${namespace}]` })

/** Tees every record at `level` and above into another sink (e.g. an OTLP exporter). */
export function addLogStream(stream: DestinationStream, level: Level = 'info'): void {
  streams.add({ level, stream })
}
