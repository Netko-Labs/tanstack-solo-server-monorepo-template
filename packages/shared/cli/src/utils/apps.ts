import * as fs from 'node:fs'
import * as path from 'node:path'
import { getRootDir } from './shell'

/**
 * ✧･ﾟ: *✧･ﾟ:* APP UTILITIES *:･ﾟ✧*:･ﾟ✧
 *
 * Helpers for discovering and validating apps (◕‿◕✿)
 */

/**
 * Get list of available apps in the monorepo
 */
export function getAvailableApps(): string[] {
  const rootDir = getRootDir()
  const appsDir = path.join(rootDir, 'apps')

  if (!fs.existsSync(appsDir)) {
    return []
  }

  return fs.readdirSync(appsDir).filter((name) => {
    const appPath = path.join(appsDir, name)
    return fs.statSync(appPath).isDirectory() && fs.existsSync(path.join(appPath, 'package.json'))
  })
}

/**
 * Validate that an app exists
 */
export function validateApp(appName: string): boolean {
  const apps = getAvailableApps()
  return apps.includes(appName)
}

/**
 * Parse --app flag from args
 */
export function parseAppArg(args: string[]): string | null {
  const appIndex = args.findIndex((arg) => arg === '--app' || arg === '-a')
  if (appIndex === -1 || appIndex === args.length - 1) {
    return null
  }
  return args[appIndex + 1] ?? null
}

/** The workspace package name of an app (its folder name is not it). */
export function getAppPackageName(appName: string): string {
  const pkg = JSON.parse(fs.readFileSync(path.join(getAppDir(appName), 'package.json'), 'utf-8'))
  return String(pkg.name)
}

/** Fail fast with the fix, instead of failing later inside drizzle with an empty URL. */
export function requireEnvFile(appName: string): string {
  const envFile = path.join(getAppDir(appName), '.env')
  if (!fs.existsSync(envFile)) {
    console.error(`❌ apps/${appName}/.env is missing. Create it from the sample:`)
    console.error(`   cp apps/${appName}/sample.env apps/${appName}/.env`)
    process.exit(1)
  }
  return envFile
}

/**
 * Get app directory path
 */
export function getAppDir(appName: string): string {
  return path.join(getRootDir(), 'apps', appName)
}

/**
 * Get app package directory path
 */
export function getAppPackageDir(appName: string): string {
  return path.join(getRootDir(), 'packages', appName)
}

/**
 * Get repository package directory path
 */
export function getRepositoryDir(appName: string): string {
  return path.join(getAppPackageDir(appName), 'repository')
}
