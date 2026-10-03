import {
  getAppDir,
  getAvailableApps,
  parseAppArg,
  requireEnvFile,
  validateApp,
} from '../utils/apps'
import { assertNitroPatchApplied } from '../utils/nitro'
import { killProcessOnPort, loadEnvFile, run } from '../utils/shell'
import { dbGenerate, dbMigrate } from './db'
import { dockerUp } from './docker'

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

  requireEnvFile(appName)
  console.log(`🚀 Starting full development setup for ${appName}...\n`)

  await dockerUp(args)
  await dbGenerate(args)
  await dbMigrate(args)
  await serve(args)
}

export async function serve(args: string[]) {
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
  assertNitroPatchApplied(appDir)
  const appEnv = loadEnvFile(requireEnvFile(appName))

  const port = Number(appEnv.PORT || process.env.PORT || 3000)

  console.log(`🔍 Checking if port ${port} is in use...`)
  await killProcessOnPort(port)

  console.log(`\n🖥️  Starting ${appName} on port ${port}...`)

  await run(['bun', '--bun', 'vite', 'dev'], {
    cwd: appDir,
    env: appEnv,
  })
}

export async function checkNitroPatch(args: string[]) {
  const appName = parseAppArg(args)

  if (!appName || !validateApp(appName)) {
    console.error('❌ Please specify an app with --app <name>')
    console.log(`Available apps: ${getAvailableApps().join(', ')}`)
    process.exit(1)
  }

  assertNitroPatchApplied(getAppDir(appName))
  console.log(`✅ nitro dev patch applied for ${appName}`)
}
