import type { RedisClient } from 'bun'

/** Just enough of RedisClient for the subscriber side: records every SUBSCRIBE. */
export function fakeRedisClient() {
  const calls: string[] = []
  const ops: string[] = []
  const client = {
    onconnect: null as (() => void) | null,
    onclose: null as ((error: Error) => void) | null,
    failUntil: 0,
    subscribeDelayMs: 0,
    unsubscribeDelayMs: 0,
    async subscribe(channel: string) {
      calls.push(channel)
      if (calls.length <= this.failUntil) throw new Error('SUBSCRIBE refused')
      if (this.subscribeDelayMs > 0) await Bun.sleep(this.subscribeDelayMs)
      ops.push(`sub:${channel}`)
      return 1
    },
    async unsubscribe(channel: string) {
      if (this.unsubscribeDelayMs > 0) await Bun.sleep(this.unsubscribeDelayMs)
      ops.push(`unsub:${channel}`)
    },
    close() {},
  }
  return { client: client as unknown as RedisClient, calls, ops }
}
