import { existsSync, readFileSync } from 'node:fs'
import * as path from 'node:path'
import {
  getAppDir,
  getAvailableApps,
  getRepositoryDir,
  parseAppArg,
  requireEnvFile,
  validateApp,
} from '../utils/apps'
import { getPackageScope } from '../utils/scope'
import { getRootDir, loadEnvFile, run } from '../utils/shell'

export async function dbMigrate(args: string[]) {
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
  const repoDir = getRepositoryDir(appName)
  const envFile = path.join(appDir, '.env')

  console.log(`🗃️  Running migrations for ${appName}...`)

  await run(['bun', 'run', `--env-file=${envFile}`, '--cwd', repoDir, 'db:migrate'], {
    cwd: getRootDir(),
  })

  console.log(`✅ Migrations for ${appName} completed!`)
}

export async function dbGenerate(args: string[]) {
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

  console.log(`🗃️  Generating schema for ${appName}...`)

  const scope = await getPackageScope()
  await run(['bun', 'run', '--filter', `${scope}/${appName}-repository`, 'db:generate'], {
    cwd: getRootDir(),
  })

  console.log(`✅ Schema generation for ${appName} completed!`)
}

export async function dbSeed(args: string[]) {
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

  const repoDir = getRepositoryDir(appName)
  const repoPkg = JSON.parse(readFileSync(path.join(repoDir, 'package.json'), 'utf-8'))
  if (!repoPkg.scripts?.['db:seed']) {
    console.log(`ℹ️  No seed defined for ${appName} (no db:seed script in its repository)`)
    return
  }

  const envFile = requireEnvFile(appName)

  console.log(`🌱 Seeding database for ${appName}...`)

  await run(['bun', 'run', `--env-file=${envFile}`, '--cwd', repoDir, 'db:seed'], {
    cwd: getRootDir(),
  })

  console.log(`✅ Seed for ${appName} completed!`)
}

export async function dbPush(args: string[]) {
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
  const repoDir = getRepositoryDir(appName)
  const envFile = path.join(appDir, '.env')
  const appEnv = loadEnvFile(envFile)

  console.log(`🚀 Pushing schema changes for ${appName}...`)

  await run(['bunx', '--bun', 'drizzle-kit', 'push'], {
    cwd: repoDir,
    env: { ...appEnv, DOTENV_CONFIG_PATH: envFile },
  })

  console.log(`✅ Schema push for ${appName} completed!`)
}

export async function dbStudio(args: string[]) {
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
  const repoDir = getRepositoryDir(appName)
  const envPath = path.join(appDir, '.env')

  if (!existsSync(envPath)) {
    console.error(`❌ No .env file found for ${appName}`)
    process.exit(1)
  }

  console.log(`🔍 Opening Drizzle Studio for ${appName}...`)
  const env = loadEnvFile(envPath)

  await run(['bunx', 'drizzle-kit', 'studio'], {
    cwd: repoDir,
    env,
  })
}
