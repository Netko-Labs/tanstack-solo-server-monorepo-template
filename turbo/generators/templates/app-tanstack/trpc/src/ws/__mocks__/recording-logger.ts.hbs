import type { EdgeLogger } from '../../types'

type LoggedLine = { level: string; fields: Record<string, unknown>; message: string }

export function recordingLogger() {
  const lines: LoggedLine[] = []
  const record = (level: string) => (fields: object, message: string) => {
    lines.push({ level, fields: fields as Record<string, unknown>, message })
  }
  const logger: EdgeLogger = { info: record('info'), warn: record('warn') }
  return { lines, logger }
}
