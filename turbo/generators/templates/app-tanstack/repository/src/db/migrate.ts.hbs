import * as fs from 'node:fs'
import * as path from 'node:path'
import { migrate } from 'drizzle-orm/bun-sql/migrator'
import { db } from './client'

// `drizzle/` sits next to this file in src and is copied next to the bundle by `repo build`.
// An app with no migrations yet has nothing to apply and must still start.
const migrationsFolder = path.join(import.meta.dir, 'drizzle')
if (fs.existsSync(path.join(migrationsFolder, 'meta', '_journal.json'))) {
  await migrate(db, { migrationsFolder })
} else {
  console.log('no migrations to apply')
}
await db.$client.close()
