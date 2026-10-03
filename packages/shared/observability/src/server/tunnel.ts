import { dsnToString, handleTunnelRequest, makeDsn } from '@sentry/core'
import type { TunnelOptions } from '../types'
import { TUNNEL_MAX_BYTES } from './constants'

async function readCapped(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer> | null> {
  const declared = request.headers.get('content-length')
  if (declared !== null && Number(declared) > maxBytes) return null
  if (!request.body) return new Uint8Array()
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return Buffer.concat(chunks)
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
}

// The SDK compares the envelope's DSN to this list by exact string, in its own format.
function normalizeDsns(dsns: readonly string[]): string[] {
  return dsns.flatMap((dsn) => {
    const components = makeDsn(dsn.trim())
    return components ? [dsnToString(components)] : []
  })
}

/**
 * Forwards a browser envelope to the DSN it names, if that DSN is allowed: an unauthenticated
 * public forwarder, so the allow-list and the body cap are not optional.
 */
export async function handleSentryTunnel(
  request: Request,
  { allowedDsns, maxBytes = TUNNEL_MAX_BYTES }: TunnelOptions,
): Promise<Response> {
  const allowed = normalizeDsns(allowedDsns)
  if (allowed.length === 0) return new Response('tunnel not configured', { status: 404 })
  const body = await readCapped(request, maxBytes)
  if (!body) return new Response('payload too large', { status: 413 })
  const forwarded = new Request(request.url, { method: 'POST', body })
  return handleTunnelRequest({ request: forwarded, allowedDsns: allowed })
}
