import { expect, test } from 'bun:test'
import { assertProductionEnv } from './env'

const PRODUCTION_ENV = {
  NODE_ENV: 'production',
  BASE_URL: 'https://studio.example.com',
  DATABASE_URL: 'postgresql://db/studio',
  AUTH_SECRET: 'x'.repeat(32),
  RESEND_API_KEY: 're_test',
}

test('production refuses to boot without its required env, naming every missing var', () => {
  expect(() => assertProductionEnv({ NODE_ENV: 'production' })).toThrow(
    'production requires BASE_URL, DATABASE_URL, AUTH_SECRET, RESEND_API_KEY',
  )
  expect(() => assertProductionEnv({ ...PRODUCTION_ENV, AUTH_SECRET: 'short' })).toThrow(
    'AUTH_SECRET must be at least 32 characters',
  )
  expect(() => assertProductionEnv(PRODUCTION_ENV)).not.toThrow()
})

test('outside production nothing is required', () => {
  expect(() => assertProductionEnv({ NODE_ENV: 'development' })).not.toThrow()
  expect(() => assertProductionEnv({})).not.toThrow()
})
