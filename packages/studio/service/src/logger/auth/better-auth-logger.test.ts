import { expect, test } from 'bun:test'
import { Writable } from 'node:stream'
import { addLogStream } from '@temp-repo/logger'
import { betterAuthLogger } from './better-auth-logger'

test('better-auth lines reach pino as JSON without SQL params or object contents', async () => {
  const lines: string[] = []
  addLogStream(
    new Writable({
      write(chunk, _encoding, done) {
        lines.push(String(chunk))
        done()
      },
    }),
    'warn',
  )
  const query = new Error('Failed query: select 1\nparams: victim@example.com', {
    cause: Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' }),
  })
  betterAuthLogger.log?.('error', 'unable to query your database.\nError: ', query, {
    token: 'secret',
  })
  await Bun.sleep(10)
  const record = JSON.parse(lines.at(-1) ?? '{}')
  expect(record).toMatchObject({
    level: 50,
    namespace: '[auth]',
    msg: 'unable to query your database.\nError:',
    args: [{ message: 'connection refused', code: 'ECONNREFUSED' }, '[Object]'],
  })
  expect(lines.join('')).not.toContain('victim@example.com')
  expect(lines.join('')).not.toContain('secret')
})
