import { describe, expect, test } from 'bun:test'
import { parseSignInSearch } from '../utils'

describe('parseSignInSearch', () => {
  test('keeps a same-origin redirect and the link error', () => {
    expect(parseSignInSearch({ redirect: '/todos', error: 'INVALID_TOKEN' })).toEqual({
      redirect: '/todos',
      error: 'INVALID_TOKEN',
    })
  })

  test('drops an off-origin redirect and anything that is not a string', () => {
    expect(parseSignInSearch({ redirect: '//evil.example', error: 1 })).toEqual({})
  })
})
