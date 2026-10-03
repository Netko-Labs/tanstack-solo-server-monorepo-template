import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getAppDir, getAvailableApps } from '../utils/apps'
import { findProcessesOnPort, loadEnvFile, runQuiet } from '../utils/shell'

export const status = async () => {
  console.log('Monorepo Status\n')

  const dockerRunning = await runQuiet(['docker', 'info'])
    .then(() => true)
    .catch(() => false)
  console.log(`Docker: ${dockerRunning ? '✓ Running' : '✗ Not running'}`)

  if (dockerRunning) {
    const containers = await runQuiet(['docker', 'ps', '--format', '{{.Names}}']).catch(() => '')
    const containerList = containers.trim().split('\n').filter(Boolean)
    console.log(`Containers: ${containerList.length > 0 ? containerList.join(', ') : 'None'}`)
  }

  const apps = getAvailableApps()
  console.log(`\nApps: ${apps.join(', ')}`)

  for (const app of apps) {
    const envPath = join(getAppDir(app), '.env')
    if (existsSync(envPath)) {
      const env = loadEnvFile(envPath)
      const port = env.PORT || '3000'
      const pids = await findProcessesOnPort(Number(port))
      console.log(`  ${app}: Port ${port} ${pids.length ? `(PID: ${pids.join(', ')})` : '(free)'}`)
    }
  }
}
