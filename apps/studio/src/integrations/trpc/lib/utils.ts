import { TRPC_WS_PATH } from './constants'

/** Same-origin WebSocket URL, so the browser sends the session cookie on the upgrade. */
export function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}${TRPC_WS_PATH}`
}
