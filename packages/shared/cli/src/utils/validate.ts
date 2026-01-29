import { runQuiet } from './shell'

/**
 * ✧･ﾟ: *✧･ﾟ:* VALIDATION UTILITIES *:･ﾟ✧*:･ﾟ✧
 *
 * Environment validation helpers (◕‿◕✿)
 */

export const validateEnvironment = async (): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = []

  // Check Bun version
  try {
    const bunVersion = await runQuiet(['bun', '--version'])
    const version = Number.parseFloat(bunVersion.trim())
    if (version < 1.0) {
      errors.push(`Bun 1.0+ is required (found ${bunVersion.trim()})`)
    }
  } catch {
    errors.push('Bun is not installed')
  }

  // Check Docker
  try {
    await runQuiet(['docker', '--version'])
  } catch {
    errors.push('Docker is not installed or not in PATH')
  }

  // Check Docker is running
  try {
    await runQuiet(['docker', 'info'])
  } catch {
    errors.push('Docker daemon is not running')
  }

  // Check docker compose
  try {
    await runQuiet(['docker', 'compose', 'version'])
  } catch {
    errors.push('Docker Compose is not available')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const printValidationErrors = (errors: string[]) => {
  console.error('\nEnvironment validation failed:\n')
  for (const e of errors) {
    console.error(`  ✗ ${e}`)
  }
  console.error('\nPlease fix the above issues and try again.\n')
}

export const requireValidEnvironment = async () => {
  const { valid, errors } = await validateEnvironment()
  if (!valid) {
    printValidationErrors(errors)
    process.exit(1)
  }
}
