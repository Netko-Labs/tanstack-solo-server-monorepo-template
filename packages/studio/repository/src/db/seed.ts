import { db } from './client'

if (process.env.NODE_ENV === 'production') {
  console.error('db:seed refuses to run with NODE_ENV=production')
  process.exit(1)
}

// Re-runnable: delete this seed's own fixture rows, then insert them again; touch nothing else.
await db.transaction(async () => {})
console.log('seed: no fixtures defined yet')
await db.$client.close()
