import * as path from 'node:path'
import { getAppDir, getAvailableApps, parseAppArg, validateApp } from '../utils/apps'
import { getRootDir, loadEnvFile, run } from '../utils/shell'

/**
 * ✧･ﾟ: *✧･ﾟ:* DEV COMMAND *:･ﾟ✧*:･ﾟ✧
 *
 * Run development server for an app (◕‿◕✿)
 */

/**
 * Run development server for an app using turbo
 */
export async function dev(args: string[]) {
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

  const appDir = getAppDir(appName)
  const envFile = path.join(appDir, '.env')
  const appEnv = loadEnvFile(envFile)

  console.log(`🚀 Starting development server for ${appName}...`)

  await run(['turbo', 'run', 'dev', '--filter', `${appName}-app`], {
    cwd: getRootDir(),
    env: appEnv,
  })
}
