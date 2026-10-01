import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  getAppDir,
  getAppPackageName,
  getAvailableApps,
  parseAppArg,
  validateApp,
} from '../utils/apps'
import { getRootDir, loadEnvFile, run } from '../utils/shell'

const DEFAULT_ENV_APP = 'studio'
const GATED_SUITE_VARS = ['DATABASE_URL', 'CACHE_URL']

export const test = async (args: string[]) => {
  const appName = parseAppArg(args)
  const watch = args.includes('--watch') || args.includes('-w')
  const coverage = args.includes('--coverage')
  const rootDir = getRootDir()

  const cmd: string[] = ['turbo', 'run', 'test']

  if (appName) {
    if (!validateApp(appName)) {
      console.error(`App "${appName}" not found`)
      console.log(`Available apps: ${getAvailableApps().join(', ')}`)
      process.exit(1)
    }
    cmd.push('--filter', `${getAppPackageName(appName)}...`)
  }

  const extraFlags: string[] = []
  if (watch) extraFlags.push('--watch')
  if (coverage) extraFlags.push('--coverage')

  if (extraFlags.length > 0) {
    cmd.push('--', ...extraFlags)
  }

  const env = appTestEnv(appName ?? DEFAULT_ENV_APP)
  const unset = GATED_SUITE_VARS.filter((name) => !env[name] && !process.env[name])
  if (unset.length > 0) {
    console.log(`ℹ️  ${unset.join(' and ')} unset: the suites gated on them will skip`)
  }

  await run(cmd, { cwd: rootDir, env })
}

export const testSmoke = async (args: string[]) => {
  const appName = parseAppArg(args) ?? DEFAULT_ENV_APP

  if (!validateApp(appName)) {
    console.error(`App "${appName}" not found`)
    console.log(`Available apps: ${getAvailableApps().join(', ')}`)
    process.exit(1)
  }

  if (!fs.existsSync(path.join(getAppDir(appName), '.output', 'server', 'index.mjs'))) {
    console.error(`❌ apps/${appName} has no build. Run: bun run repo build --app ${appName}`)
    process.exit(1)
  }

  // Only the service URLs: the smoke supplies its own throwaway production env.
  const appEnv = appTestEnv(appName)
  const env = Object.fromEntries(
    GATED_SUITE_VARS.flatMap((name) => (appEnv[name] ? [[name, appEnv[name]]] : [])),
  )

  await run(['bun', 'tests/smoke.ts', '--app', appName], { cwd: getRootDir(), env })
}

/** The app's .env under the shell's own env, which wins: CI sets its service URLs there. */
function appTestEnv(appName: string): Record<string, string> {
  if (!validateApp(appName)) return {}
  const fileEnv = loadEnvFile(path.join(getAppDir(appName), '.env'))
  return Object.fromEntries(Object.entries(fileEnv).filter(([name]) => !(name in process.env)))
}
