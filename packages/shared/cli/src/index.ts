#!/usr/bin/env bun

import { build } from './commands/build'
import { clean } from './commands/clean'
import { dbGenerate, dbMigrate, dbPush, dbSeed, dbStudio } from './commands/db'
import { dev, serve } from './commands/dev'
import { dockerDown, dockerUp } from './commands/docker'
import { generateApp, generateLib } from './commands/generate'
import { info } from './commands/info'
import { logs } from './commands/logs'
import { previewRename, renameProject } from './commands/rename'
import { reset } from './commands/reset'
import { status } from './commands/status'
import { test, testSmoke } from './commands/test'
import { printHelp } from './utils/help'

const args = process.argv.slice(2)
const command = args[0]

const commands: Record<string, (args: string[]) => Promise<void>> = {
  dev: dev,
  serve: serve,
  build: build,

  'docker:up': dockerUp,
  'docker:down': dockerDown,

  'db:migrate': dbMigrate,
  'db:generate': dbGenerate,
  'db:push': dbPush,
  'db:seed': dbSeed,
  'db:studio': dbStudio,

  'generate:app': async () => generateApp(),
  'generate:lib': async () => generateLib(),

  status: async () => status(),
  info: info,
  clean: async () => clean(),
  reset: reset,
  logs: logs,

  test: test,
  'test:smoke': testSmoke,

  rename: renameProject,
  'rename:preview': previewRename,
}

const main = async () => {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp()
    process.exit(0)
  }

  const handler = commands[command]
  if (!handler) {
    console.error(`Unknown command: ${command}\n`)
    printHelp()
    process.exit(1)
  }

  try {
    await handler(args.slice(1))
  } catch (error) {
    console.error(`Command failed: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
}

main()
