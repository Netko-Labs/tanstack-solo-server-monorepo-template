import { getAvailableApps, parseAppArg, validateApp } from '../utils/apps'
import { getRootDir, run } from '../utils/shell'

/**
 * ✧･ﾟ: *✧･ﾟ:* DOCKER COMMANDS *:･ﾟ✧*:･ﾟ✧
 *
 * Docker Compose commands with profile support (◕‿◕✿)
 */

/**
 * Start Docker containers for an app using profiles
 */
export async function dockerUp(args: string[]) {
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

  console.log(`🐳 Starting Docker containers for ${appName}...`)

  await run(['docker', 'compose', '--profile', appName, 'up', '-d'], {
    cwd: getRootDir(),
  })

  console.log(`✅ Docker containers for ${appName} are running!`)
}

/**
 * Stop Docker containers for an app
 */
export async function dockerDown(args: string[]) {
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

  console.log(`🐳 Stopping Docker containers for ${appName}...`)

  await run(['docker', 'compose', '--profile', appName, 'down'], {
    cwd: getRootDir(),
  })

  console.log(`✅ Docker containers for ${appName} stopped!`)
}
