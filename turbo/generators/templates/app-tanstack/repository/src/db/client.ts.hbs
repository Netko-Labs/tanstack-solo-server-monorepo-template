import { drizzle } from 'drizzle-orm/bun-sql'

const url = process.env.DATABASE_URL ?? ''
// An empty URL makes Bun SQL connect to localhost:5432 as the OS user; never in production.
// Locally the CLI fails fast when .env is missing, and tests import this module without a DB.
if (!url && process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL is required')

type Db = ReturnType<typeof drizzle>
// One pool per process: the SSR and WebSocket bundles are separate module graphs.
const DB_KEY = Symbol.for('studio.db')
const globalDb = globalThis as typeof globalThis & Record<symbol, Db | undefined>
globalDb[DB_KEY] ??= drizzle(url)

export const db: Db = globalDb[DB_KEY]

export const closeDb = (): Promise<void> => db.$client.close()
