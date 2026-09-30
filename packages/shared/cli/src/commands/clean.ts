import * as fs from 'node:fs'
import * as path from 'node:path'
import { Glob } from 'bun'
import { getRootDir } from '../utils/shell'

const ARTIFACT_DIRS = ['dist', '.output', '.nitro', '.tanstack', '.turbo', 'node_modules/.cache']
const ARTIFACT_FILES = ['tsconfig.tsbuildinfo']

/**
 * Remove build artifacts and caches everywhere in the monorepo, never touching sources.
 */
export async function clean() {
  console.log('🧹 Cleaning build artifacts...\n')

  const rootDir = getRootDir()
  const patterns = [
    ...ARTIFACT_DIRS.map((dir) => `**/${dir}`),
    ...ARTIFACT_FILES.map((file) => `**/${file}`),
  ]
  let removed = 0

  for (const pattern of patterns) {
    const glob = new Glob(pattern)
    for (const match of glob.scanSync({ cwd: rootDir, onlyFiles: false, dot: true })) {
      if (match.includes('node_modules/') && !match.endsWith('node_modules/.cache')) continue
      fs.rmSync(path.join(rootDir, match), { recursive: true, force: true })
      console.log(`  Removed: ${match}`)
      removed += 1
    }
  }

  console.log(`\n✅ Removed ${removed} artifact${removed === 1 ? '' : 's'}.`)
}
