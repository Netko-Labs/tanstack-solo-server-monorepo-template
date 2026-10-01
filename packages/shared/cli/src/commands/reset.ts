import { getAppDir, getAvailableApps, parseAppArg, validateApp } from '../utils/apps'
import { run } from '../utils/shell'
import { dbMigrate } from './db'
import { dockerUp } from './docker'

export async function reset(args: string[]) {
  const appName = parseAppArg(args)

  if (!appName) {
    console.error('❌ Please specify an app with --app <name>')
    console.log(`Available apps: ${getAvailableApps().join(', ')}`)
    process.exit(1)
  }

  if (!validateApp(appName)) {
    console.error(`❌ App "${appName}" not found`)
    console.log(`Available apps: ${getAvailableApps().join(', ')}`)
    process.exit(1)
  }

  console.log(`🔄 Resetting ${appName}...\n`)

  console.log('🐳 Stopping containers and removing their volumes...')
  await run(['docker', 'compose', '--profile', appName, 'down', '-v'], { cwd: getAppDir(appName) })

  console.log('\n🐳 Starting fresh containers...')
  await dockerUp(args)

  console.log('\n🗃️  Running migrations...')
  await dbMigrate(args)

  console.log(`\n✅ ${appName} has been reset!`)
}
