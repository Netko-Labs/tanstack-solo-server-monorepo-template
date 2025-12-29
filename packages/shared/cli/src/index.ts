#!/usr/bin/env bun

/**
 * ✧･ﾟ: *✧･ﾟ:* REPO CLI *:･ﾟ✧*:･ﾟ✧
 *
 * A Bun-powered CLI for managing the monorepo! (◕‿◕✿)
 *
 * Usage: bun repo <command> [options]
 */

import { build } from './commands/build'
import { dbGenerate, dbMigrate, dbPush, dbSeed } from './commands/db'
import { dev, serve } from './commands/dev'
import { dockerDown, dockerUp } from './commands/docker'
import { generateApp, generateLib } from './commands/generate'
import { previewRename, renameProject } from './commands/rename'
import { printHelp } from './utils/help'

const args = process.argv.slice(2)
const command = args[0]

async function main() {
  switch (command) {
    // Docker commands
    case 'docker:up':
      await dockerUp(args.slice(1))
      break
    case 'docker:down':
      await dockerDown(args.slice(1))
      break

    // Database commands
    case 'db:migrate':
      await dbMigrate(args.slice(1))
      break
    case 'db:generate':
      await dbGenerate(args.slice(1))
      break
    case 'db:seed':
      await dbSeed(args.slice(1))
      break
    case 'db:push':
      await dbPush(args.slice(1))
      break

    // Dev & Build commands
    case 'dev':
      await dev(args.slice(1))
      break
    case 'serve':
      await serve(args.slice(1))
      break
    case 'build':
      await build(args.slice(1))
      break

    // Generator commands
    case 'generate:app':
      await generateApp()
      break
    case 'generate:lib':
      await generateLib()
      break

    // Rename commands
    case 'rename':
      await renameProject(args.slice(1))
      break
    case 'rename:preview':
      await previewRename(args.slice(1))
      break

    // Help
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      printHelp()
      break

    default:
      console.error(`❌ Unknown command: ${command}`)
      printHelp()
      process.exit(1)
  }
}

main().catch((error) => {
  console.error('💥 CLI Error:', error)
  process.exit(1)
})
