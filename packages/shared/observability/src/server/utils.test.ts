import { describe, expect, test } from 'bun:test'
import { innermostError, markVendorFrames, otlpUrl } from './utils'

describe('server utils', () => {
  test('the OTLP signal path is appended once', () => {
    expect(otlpUrl('https://w.example.com/otlp/', 'logs')).toBe(
      'https://w.example.com/otlp/v1/logs',
    )
  })

  test('the innermost cause is what gets reported', () => {
    const root = new Error('duplicate key')
    const wrapper = new Error('Failed query: insert ... params: secret', { cause: root })
    expect(innermostError(new Error('outer', { cause: wrapper }))).toBe(root)
    expect(innermostError('text')).toBe('text')
  })

  test('bundled vendor frames are not app frames', () => {
    const event = markVendorFrames({
      type: undefined,
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                { filename: '/app/.output/server/_libs/better-auth.mjs' },
                { filename: '/app/node_modules/.bun/x/index.js' },
                { filename: '/app/.output/server/_ssr/index.mjs' },
              ],
            },
          },
        ],
      },
    })
    const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? []
    expect(frames.map((frame) => frame.in_app)).toEqual([false, false, undefined])
  })
})
