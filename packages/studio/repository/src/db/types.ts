import type { drizzle } from 'drizzle-orm/bun-sql'

export type Db = ReturnType<typeof drizzle>

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
