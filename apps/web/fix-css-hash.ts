/**
 * Post-build script to fix CSS hash mismatch between client and server builds.
 *
 * This is a workaround for a known issue with TanStack Start + Tailwind CSS v4
 * where the SSR build generates a different CSS hash than the client build.
 *
 * The script:
 * 1. Finds the actual CSS file in dist/client/assets/
 * 2. Finds the incorrect CSS reference in dist/server/assets/*.js
 * 3. Replaces the incorrect reference with the correct one
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const CLIENT_ASSETS = join(import.meta.dir, 'dist', 'client', 'assets')
const SERVER_ASSETS = join(import.meta.dir, 'dist', 'server', 'assets')

async function fixCssHash() {
  console.log('🔧 Fixing CSS hash mismatch...')

  // Find the actual CSS file in client assets
  const clientFiles = await readdir(CLIENT_ASSETS)
  const cssFile = clientFiles.find((f) => f.startsWith('styles-') && f.endsWith('.css'))

  if (!cssFile) {
    console.log('⚠️  No styles-*.css file found in client assets')
    return
  }

  const correctCssPath = `/assets/${cssFile}`
  console.log(`✅ Found client CSS: ${correctCssPath}`)

  // Find and fix server JS files
  const serverFiles = await readdir(SERVER_ASSETS)
  const jsFiles = serverFiles.filter((f) => f.endsWith('.js'))

  let fixed = false
  for (const jsFile of jsFiles) {
    const filePath = join(SERVER_ASSETS, jsFile)
    let content = await readFile(filePath, 'utf-8')

    // Look for incorrect CSS references (styles-*.css pattern)
    const cssPattern = /\/assets\/styles-[A-Za-z0-9_-]+\.css/g
    const matches = content.match(cssPattern)

    if (matches) {
      for (const match of matches) {
        if (match !== correctCssPath) {
          console.log(`🔄 Fixing ${jsFile}: ${match} → ${correctCssPath}`)
          content = content.replace(match, correctCssPath)
          fixed = true
        }
      }
      await writeFile(filePath, content)
    }
  }

  if (fixed) {
    console.log('✨ CSS hash mismatch fixed successfully!')
  } else {
    console.log('✅ No CSS hash mismatch found')
  }
}

fixCssHash().catch(console.error)
