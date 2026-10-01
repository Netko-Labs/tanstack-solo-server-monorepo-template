import * as fs from 'node:fs'
import * as path from 'node:path'

const DEV_ENTRY = path.join('dist', 'runtime', 'internal', 'vite', 'dev-entry.mjs')
const PATCH_MARKER = 'isNodeRuntime'

// bun install drops a patch whose patchedDependencies key no longer matches the installed version,
// silently; vite dev then answers 500 on every route. null: the app does not depend on nitro.
export function isNitroPatchApplied(appDir: string): boolean | null {
  const pkg = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf-8'))
  if (!pkg.dependencies?.nitro && !pkg.devDependencies?.nitro) return null
  const manifest = Bun.resolveSync('nitro/package.json', appDir)
  const entry = path.join(path.dirname(manifest), DEV_ENTRY)
  return fs.existsSync(entry) && fs.readFileSync(entry, 'utf-8').includes(PATCH_MARKER)
}

export function assertNitroPatchApplied(appDir: string): void {
  if (isNitroPatchApplied(appDir) !== false) return
  console.error(
    '❌ nitro patch not applied: patchedDependencies key must match the installed nitro version',
  )
  console.error(
    '   Rename patches/nitro@<version>.patch and its key in package.json, then bun install',
  )
  process.exit(1)
}
