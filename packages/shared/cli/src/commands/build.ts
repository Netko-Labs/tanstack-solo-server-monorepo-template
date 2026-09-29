import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  getAppDir,
  getAvailableApps,
  getRepositoryDir,
  parseAppArg,
  validateApp,
} from '../utils/apps'
import { getRootDir, loadEnvFile, run } from '../utils/shell'

/**
 * ✧･ﾟ: *✧･ﾟ:* BUILD COMMAND *:･ﾟ✧*:･ﾟ✧
 *
 * Build an app for production (◕‿◕✿)
 */

/**
 * Build an app for production. Vite apps run `vite build`; headless server apps
 * bundle their entry with `bun build`.
 */
export async function build(args: string[]) {
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

  console.log(`📦 Building ${appName} for production...`)

  // A local .env usually says NODE_ENV=development; a production bundle must not inherit it.
  await run(['bun', '--bun', 'vite', 'build'], {
    cwd: appDir,
    env: { ...appEnv, NODE_ENV: 'production' },
  })

  await bundleMigrator(appName, path.join(appDir, '.output'))

  console.log(`✅ Build for ${appName} completed!`)
}

/**
 * Bundle the repository's `migrate.ts` (plus its `drizzle/` SQL) into `{outDir}/migrate` so a
 * deploy image without node_modules can still run `bun {outDir}/migrate/migrate.js`.
 */
async function bundleMigrator(appName: string, outDir: string) {
  const dbDir = path.join(getRepositoryDir(appName), 'src', 'db')
  const entry = path.join(dbDir, 'migrate.ts')

  if (!fs.existsSync(entry)) {
    return
  }

  const migrateDir = path.join(outDir, 'migrate')

  console.log(`🗃️  Bundling migrator for ${appName}...`)

  await run(['bun', 'build', entry, '--outdir', migrateDir, '--target', 'bun'], {
    cwd: getRootDir(),
  })
  fs.cpSync(path.join(dbDir, 'drizzle'), path.join(migrateDir, 'drizzle'), { recursive: true })
}
