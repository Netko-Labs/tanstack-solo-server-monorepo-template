import { join } from 'node:path'
import { getRootDir } from './shell'

export const getPackageScope = async (): Promise<string> => {
  const rootDir = getRootDir()
  const pkgPath = join(rootDir, 'package.json')
  const pkg = await Bun.file(pkgPath).json()
  const name = pkg.name as string
  return name.startsWith('@') ? (name.split('/')[0] ?? '@temp-repo') : '@temp-repo'
}

export function requireScope(scope: string | undefined, command: string): string {
  if (!scope) {
    console.error('❌ Error: New scope name is required')
    console.log(`\nUsage: bun repo ${command} <new-scope>`)
    console.log(`Example: bun repo ${command} @my-company`)
    process.exit(1)
  }

  if (!scope.startsWith('@')) {
    console.error('❌ Error: Scope name must start with "@"')
    console.log('Example: @my-company, @acme, @myorg')
    process.exit(1)
  }

  if (!/^@[a-z0-9-]+$/.test(scope)) {
    console.error('❌ Error: Scope name must contain only lowercase letters, numbers, and hyphens')
    console.log('Example: @my-company, @acme-corp, @my-org123')
    process.exit(1)
  }

  return scope
}
