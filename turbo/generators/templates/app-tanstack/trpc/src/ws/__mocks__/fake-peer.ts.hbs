export function fakePeer(origin?: string, onSend?: (peer: { id: string }, data: string) => void) {
  const sent: string[] = []
  const headers = new Headers({ host: 'app.test' })
  if (origin) headers.set('origin', origin)
  return {
    id: crypto.randomUUID(),
    request: new Request('http://app.test/trpc-ws', { headers }),
    sent,
    closed: false,
    closeCode: undefined as number | undefined,
    send(data: string | Uint8Array) {
      sent.push(String(data))
      onSend?.(this, String(data))
    },
    close(code?: number) {
      this.closed = true
      this.closeCode = code
    },
    terminate() {
      this.closed = true
    },
  }
}
