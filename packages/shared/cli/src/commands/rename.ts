import * as fs from 'node:fs'
import * as path from 'node:path'
import { glob } from 'glob'
import { getRootDir } from '../utils/shell'

/**
 * ✧･ﾟ: *✧･ﾟ:* RENAME PROJECT COMMAND *:･ﾟ✧*:･ﾟ✧
 *
 * Renames the project scope from @temp-repo to a new name (◕‿◕✿)
 */

const CURRENT_SCOPE = '@temp-repo'

/**
 * Rename the entire project scope
 */
export async function renameProject(args: string[]) {
  const newScope = args[0]

  if (!newScope) {
    console.error('❌ Error: New scope name is required')
    console.log('\nUsage: bun repo rename <new-scope>')
    console.log('Example: bun repo rename @my-company')
    process.exit(1)
  }

  // Validate scope name format
  if (!newScope.startsWith('@')) {
    console.error('❌ Error: Scope name must start with "@"')
    console.log('Example: @my-company, @acme, @myorg')
    process.exit(1)
  }

  if (!/^@[a-z0-9-]+$/.test(newScope)) {
    console.error('❌ Error: Scope name must contain only lowercase letters, numbers, and hyphens')
    console.log('Example: @my-company, @acme-corp, @my-org123')
    process.exit(1)
  }

  console.log(`\n🔄 Renaming project from ${CURRENT_SCOPE} to ${newScope}...\n`)

  const rootDir = getRootDir()

  // Confirm with user
  console.log('⚠️  This will modify files throughout the entire monorepo.')
  console.log('   Make sure you have committed any important changes!\n')
  console.log('Press Ctrl+C to cancel, or press Enter to continue...')

  // Wait for user input
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => {
      resolve()
    })
  })

  console.log('\n🔍 Finding files to update...\n')

  // Find all files that need updating (excluding node_modules, dist, .git)
  const filesToUpdate = await glob('**/*.{ts,tsx,js,jsx,json,hbs,md,yml,yaml}', {
    cwd: rootDir,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/bun.lock'],
    absolute: true,
  })

  console.log(`📝 Found ${filesToUpdate.length} files to scan\n`)

  let filesUpdated = 0
  let occurrencesReplaced = 0

  for (const filePath of filesToUpdate) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const newContent = content.replaceAll(CURRENT_SCOPE, newScope)

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8')
        filesUpdated++

        // Count occurrences
        const matches = content.match(new RegExp(CURRENT_SCOPE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))
        const count = matches ? matches.length : 0
        occurrencesReplaced += count

        const relativePath = path.relative(rootDir, filePath)
        console.log(`  ✅ Updated: ${relativePath} (${count} occurrence${count !== 1 ? 's' : ''})`)
      }
    } catch (error) {
      console.error(`  ❌ Error updating ${filePath}:`, error)
    }
  }

  console.log(`
╔════════════════════════════════════════════╗
║         Rename Complete! ✨                ║
╚════════════════════════════════════════════╝

📊 Summary:
   • Files updated: ${filesUpdated}
   • Occurrences replaced: ${occurrencesReplaced}
   • Old scope: ${CURRENT_SCOPE}
   • New scope: ${newScope}

🎯 Next steps:
   1. Review the changes with: git diff
   2. Run: bun install
   3. Test your apps to ensure everything works
   4. Commit the changes: git add . && git commit -m "chore: rename project to ${newScope}"

`)
}

/**
 * Preview what files would be changed without actually changing them
 */
export async function previewRename(args: string[]) {
  const newScope = args[0]

  if (!newScope) {
    console.error('❌ Error: New scope name is required')
    console.log('\nUsage: bun repo rename:preview <new-scope>')
    console.log('Example: bun repo rename:preview @my-company')
    process.exit(1)
  }

  console.log(`\n🔍 Preview: Renaming from ${CURRENT_SCOPE} to ${newScope}\n`)

  const rootDir = getRootDir()

  // Find all files that need updating
  const filesToUpdate = await glob('**/*.{ts,tsx,js,jsx,json,hbs,md,yml,yaml}', {
    cwd: rootDir,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/bun.lock'],
    absolute: true,
  })

  console.log(`📝 Scanning ${filesToUpdate.length} files...\n`)

  let filesAffected = 0
  let occurrencesFound = 0

  for (const filePath of filesToUpdate) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const matches = content.match(new RegExp(CURRENT_SCOPE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))

      if (matches && matches.length > 0) {
        filesAffected++
        occurrencesFound += matches.length

        const relativePath = path.relative(rootDir, filePath)
        console.log(`  📄 ${relativePath} (${matches.length} occurrence${matches.length !== 1 ? 's' : ''})`)
      }
    } catch (error) {
      // Silently skip files that can't be read
    }
  }

  console.log(`
╔════════════════════════════════════════════╗
║         Preview Summary 👀                 ║
╚════════════════════════════════════════════╝

📊 Would update:
   • Files: ${filesAffected}
   • Occurrences: ${occurrencesFound}
   • Old scope: ${CURRENT_SCOPE}
   • New scope: ${newScope}

💡 To perform the rename, run:
   bun repo rename ${newScope}

`)
}

