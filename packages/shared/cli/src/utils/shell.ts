import * as fs from 'node:fs'
import { $ } from 'bun'

/**
 * ✧･ﾟ: *✧･ﾟ:* SHELL UTILITIES *:･ﾟ✧*:･ﾟ✧
 *
 * Bun shell helpers for running commands (◕‿◕✿)
 */

/**
 * Load environment variables from a .env file
 */
export function loadEnvFile(envFilePath: string): Record<string, string> {
  if (!fs.existsSync(envFilePath)) {
    return {}
  }

  const content = fs.readFileSync(envFilePath, 'utf-8')
  const env: Record<string, string> = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue

    const [key, ...valueParts] = trimmed.split('=')
    if (key) {
      let value = valueParts.join('=')
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
  }

  return env
}

/**
 * Run a shell command with output streaming to console
 */
export async function run(
  command: string[],
  options?: { cwd?: string; env?: Record<string, string> },
) {
  const proc = Bun.spawn(command, {
    cwd: options?.cwd,
    env: { ...process.env, ...options?.env },
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  })

  const exitCode = await proc.exited
  if (exitCode !== 0) {
    throw new Error(`Command failed with exit code ${exitCode}: ${command.join(' ')}`)
  }
}

/**
 * Run a shell command and return output
 */
export async function runQuiet(command: string[], options?: { cwd?: string }) {
  const result = await $`${command}`.cwd(options?.cwd ?? process.cwd()).quiet()
  return result.text()
}

/**
 * Get the root directory of the monorepo
 */
export function getRootDir(): string {
  // CLI is at packages/shared/cli, so root is 3 levels up
  return new URL('../../../../', import.meta.url).pathname.replace(/\/$/, '')
}
