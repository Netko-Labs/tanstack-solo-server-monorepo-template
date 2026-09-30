import * as fs from 'node:fs'
import * as path from 'node:path'
import { Glob } from 'bun'
import { getRootDir } from '../utils/shell'

const ARTIFACT_DIRS = ['dist', '.output', '.nitro', '.tanstack', '.turbo', 'node_modules/.cache']
const ARTIFACT_FILES = ['tsconfig.tsbuildinfo']

const readWorkspaceGlobs = (rootDir: string): string[] => {
  const pkg: unknown = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
  const workspaces =
    typeof pkg === 'object' && pkg !== null && 'workspaces' in pkg ? pkg.workspaces : []
  return Array.isArray(workspaces) ? workspaces.filter((w) => typeof w === 'string') : []
}

/**
 * Remove build artifacts and caches from the repo root and every workspace, never touching
 * sources. Artifacts live at package roots, so each pattern is one level deep and the scan
 * never descends into `node_modules`.
 */
export async function clean() {
  console.log('🧹 Cleaning build artifacts...\n')

  const rootDir = getRootDir()
  const roots = ['.', ...readWorkspaceGlobs(rootDir)]
  const artifacts = [...ARTIFACT_DIRS, ...ARTIFACT_FILES]
  let removed = 0

  for (const root of roots) {
    for (const artifact of artifacts) {
      const glob = new Glob(root === '.' ? artifact : `${root}/${artifact}`)
      for (const match of glob.scanSync({ cwd: rootDir, onlyFiles: false, dot: true })) {
        fs.rmSync(path.join(rootDir, match), { recursive: true, force: true })
        console.log(`  Removed: ${match}`)
        removed += 1
      }
    }
  }

  console.log(`\n✅ Removed ${removed} artifact${removed === 1 ? '' : 's'}.`)
}
