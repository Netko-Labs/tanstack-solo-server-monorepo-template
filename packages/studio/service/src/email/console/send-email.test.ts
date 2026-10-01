import { afterEach, expect, test } from 'bun:test'
import { sendConsoleEmail } from './send-email'

const envelope = { from: 'a@example.test', to: 'b@example.test', subject: 'Hi', html: '<p/>' }
const nodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = nodeEnv
})

test('the console provider refuses outside development', async () => {
  for (const env of ['production', 'test', '']) {
    process.env.NODE_ENV = env
    await expect(sendConsoleEmail(envelope)).rejects.toThrow('RESEND_API_KEY is required')
  }
})

test('the console provider prints in development', async () => {
  process.env.NODE_ENV = 'development'
  await expect(sendConsoleEmail(envelope)).resolves.toBeUndefined()
})
