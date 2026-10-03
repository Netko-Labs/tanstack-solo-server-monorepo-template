import * as fs from 'node:fs'
import * as path from 'node:path'
import { $ } from 'bun'
import type { RunOptions } from './types'

export function loadEnvFile(envFilePath: string): Record<string, string> {
  if (!fs.existsSync(envFilePath)) {
    return {}
  }

  const content = fs.readFileSync(envFilePath, 'utf-8')
  const env: Record<string, string> = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const [key, ...valueParts] = trimmed.split('=')
    if (key) {
      let value = valueParts.join('=')
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
  }

  return env
}

export async function run(command: string[], options?: RunOptions) {
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

export async function runQuiet(command: string[], options?: Pick<RunOptions, 'cwd'>) {
  const result = await $`${command}`.cwd(options?.cwd ?? process.cwd()).quiet()
  return result.text()
}

export async function findProcessesOnPort(port: number): Promise<string[]> {
  try {
    // Listeners only: a plain `-ti :port` also lists clients (an open browser tab).
    const result = await $`lsof -ti tcp:${port} -sTCP:LISTEN`.quiet()
    return result
      .text()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

/** SIGTERM by default so a dev server runs its shutdown hooks. */
export async function killProcess(pid: string, signal = 'TERM'): Promise<boolean> {
  try {
    await $`kill -${signal} ${pid}`.quiet()
    return true
  } catch {
    return false
  }
}

const PORT_RELEASE_TIMEOUT_MS = 5_000
const PORT_POLL_MS = 200

async function waitForPortRelease(port: number): Promise<boolean> {
  const deadline = Date.now() + PORT_RELEASE_TIMEOUT_MS
  while (Date.now() < deadline) {
    if ((await findProcessesOnPort(port)).length === 0) return true
    await Bun.sleep(PORT_POLL_MS)
  }
  return false
}

/**
 * Free a port: SIGTERM its listeners and wait until the port is actually released, so the
 * caller can bind it right away; a holdout gets SIGKILL after the grace period.
 */
export async function killProcessOnPort(port: number): Promise<boolean> {
  const pids = await findProcessesOnPort(port)
  if (pids.length === 0) return false

  console.log(`⚠️  Port ${port} is held by PID ${pids.join(', ')}; stopping it...`)
  await Promise.all(pids.map((pid) => killProcess(pid)))
  if (await waitForPortRelease(port)) {
    console.log('✅ Port released')
    return true
  }

  console.log(`⚠️  Still held after ${PORT_RELEASE_TIMEOUT_MS} ms; sending SIGKILL`)
  await Promise.all((await findProcessesOnPort(port)).map((pid) => killProcess(pid, 'KILL')))
  if (await waitForPortRelease(port)) {
    console.log('✅ Port released')
    return true
  }

  console.log(`❌ Port ${port} is still held`)
  return false
}

export function getRootDir(): string {
  // Five levels up from packages/shared/cli/src/utils/.
  const thisDir = new URL('.', import.meta.url).pathname
  return path.resolve(thisDir, '..', '..', '..', '..', '..')
}
