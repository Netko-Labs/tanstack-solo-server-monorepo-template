import { getAppPackageName, getAvailableApps, parseAppArg, validateApp } from '../utils/apps'
import { getRootDir, run } from '../utils/shell'

/**
 * Run unit tests (bun test) via turbo
 */
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

  // Pass additional flags to bun test
  const extraFlags: string[] = []
  if (watch) extraFlags.push('--watch')
  if (coverage) extraFlags.push('--coverage')

  if (extraFlags.length > 0) {
    cmd.push('--', ...extraFlags)
  }

  await run(cmd, { cwd: rootDir })
}
