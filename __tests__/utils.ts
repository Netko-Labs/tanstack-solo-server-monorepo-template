import { connect } from 'node:net'
import { BOOT_TIMEOUT_MS, FRAME_TIMEOUT_MS } from './constants'
import type { HealthBody, WireRequest } from './types'

export function assert(condition: unknown, message: string, context?: unknown): asserts condition {
  if (condition) return
  throw new Error(context === undefined ? message : `${message} ${JSON.stringify(context)}`)
}

export function field(value: unknown, key: string): unknown {
  if (value === null || typeof value !== 'object') return undefined
  return (value as Record<string, unknown>)[key]
}

export function withTimeout<T>(work: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer))
}

export async function waitForHealth(baseUrl: string, exitCode: () => number | null) {
  const deadline = Date.now() + BOOT_TIMEOUT_MS
  while (Date.now() < deadline) {
    const code = exitCode()
    if (code !== null) throw new Error(`server exited with ${code} while booting`)
    const res = await fetch(`${baseUrl}/api/health`).catch(() => undefined)
    if (res) {
      const body = (await res.json()) as HealthBody
      if (res.ok) return body
      throw new Error(`health answered ${res.status} ${JSON.stringify(body)}`)
    }
    await Bun.sleep(250)
  }
  throw new Error(`no health answer within ${BOOT_TIMEOUT_MS} ms`)
}

// A raw handshake: WebSocket clients hide the status of a refused upgrade.
export function upgradeStatus(port: number, origin: string): Promise<number> {
  const work = new Promise<number>((resolve, reject) => {
    const socket = connect(port, '127.0.0.1', () => {
      const key = btoa(crypto.randomUUID().slice(0, 16))
      socket.write(
        `GET /trpc-ws HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nConnection: Upgrade\r\n` +
          `Upgrade: websocket\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: ${key}\r\n` +
          `Origin: ${origin}\r\n\r\n`,
      )
    })
    socket.once('data', (chunk) => {
      socket.destroy()
      resolve(Number(String(chunk).split(' ')[1]))
    })
    socket.once('error', reject)
  })
  return withTimeout(work, FRAME_TIMEOUT_MS, 'no answer to the upgrade')
}

export function openSocket(url: string, origin: string): Promise<WebSocket> {
  const socket = new WebSocket(url, { headers: { Origin: origin } })
  const opened = new Promise<WebSocket>((resolve, reject) => {
    socket.addEventListener('open', () => resolve(socket), { once: true })
    socket.addEventListener('error', () => reject(new Error('upgrade refused')), { once: true })
  })
  return withTimeout(opened, FRAME_TIMEOUT_MS, 'socket did not open')
}

const parseFrame = (data: unknown): unknown => {
  try {
    return JSON.parse(String(data))
  } catch {
    return undefined
  }
}

export function request(socket: WebSocket, message: WireRequest): Promise<unknown> {
  const reply = new Promise<unknown>((resolve) => {
    const onMessage = (event: MessageEvent) => {
      const frame = parseFrame(event.data)
      if (field(frame, 'id') !== message.id) return
      socket.removeEventListener('message', onMessage)
      resolve(frame)
    }
    socket.addEventListener('message', onMessage)
  })
  socket.send(JSON.stringify(message))
  return withTimeout(reply, FRAME_TIMEOUT_MS, `no reply to request ${message.id}`)
}

export function closeCode(socket: WebSocket): Promise<number> {
  return new Promise((resolve) => {
    socket.addEventListener('close', (event) => resolve(event.code), { once: true })
  })
}
