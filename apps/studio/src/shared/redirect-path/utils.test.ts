import { describe, expect, test } from 'bun:test'
import { toRedirectPath } from './utils'

describe('toRedirectPath', () => {
  test('keeps same-origin paths with their search and hash', () => {
    expect(toRedirectPath('/todos')).toBe('/todos')
    expect(toRedirectPath('/todos?filter=open#top')).toBe('/todos?filter=open#top')
  })

  test('drops anything that could leave the origin', () => {
    for (const value of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      'todos',
      '',
    ]) {
      expect(toRedirectPath(value)).toBeUndefined()
    }
    expect(toRedirectPath(42)).toBeUndefined()
    expect(toRedirectPath(undefined)).toBeUndefined()
  })
})
