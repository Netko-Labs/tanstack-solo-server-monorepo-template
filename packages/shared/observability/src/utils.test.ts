import { describe, expect, test } from 'bun:test'
import { environmentOf, isValidDsn, parseOtlpHeaders, releaseOf } from './utils'

describe('release and environment', () => {
  test('release prefers SENTRY_RELEASE, then the Coolify commit, then dev', () => {
    expect(releaseOf({ SENTRY_RELEASE: 'v1', SOURCE_COMMIT: 'abc' })).toBe('v1')
    expect(releaseOf({ SOURCE_COMMIT: 'abc' })).toBe('abc')
    expect(releaseOf({ SENTRY_RELEASE: '' })).toBe('dev')
  })

  test('environment is explicit, else derived from NODE_ENV', () => {
    expect(environmentOf({ SENTRY_ENVIRONMENT: 'staging', NODE_ENV: 'production' })).toBe('staging')
    expect(environmentOf({ NODE_ENV: 'production' })).toBe('production')
    expect(environmentOf({ NODE_ENV: 'test' })).toBe('development')
  })
})

describe('isValidDsn', () => {
  test('accepts the Sentry shape and rejects the rest', () => {
    expect(isValidDsn('https://pub@whiskers.example.com/42')).toBe(true)
    expect(isValidDsn('http://pub@127.0.0.1:4795/7')).toBe(true)
    expect(isValidDsn('https://whiskers.example.com/42')).toBe(false)
    expect(isValidDsn('https://pub@whiskers.example.com/42/')).toBe(false)
    expect(isValidDsn('https://pub@whiskers.example.com/my-project')).toBe(false)
    expect(isValidDsn('ftp://pub@whiskers.example.com/42')).toBe(false)
    expect(isValidDsn('pub@whiskers')).toBe(false)
  })
})

describe('parseOtlpHeaders', () => {
  test('reads the OTEL header list, decoding values', () => {
    expect(parseOtlpHeaders('x-codewhiskers-key=abc, Authorization=Bearer%20k')).toEqual({
      'x-codewhiskers-key': 'abc',
      Authorization: 'Bearer k',
    })
    expect(parseOtlpHeaders('broken,=v,k=')).toEqual({})
    expect(parseOtlpHeaders(undefined)).toEqual({})
  })
})
