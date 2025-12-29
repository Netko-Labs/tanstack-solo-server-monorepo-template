/**
 * ✧･ﾟ: *✧･ﾟ:* HELP UTILITIES *:･ﾟ✧*:･ﾟ✧
 *
 * CLI help output (◕‿◕✿)
 */

export function printHelp() {
  console.log(`
✧･ﾟ: *✧･ﾟ:* REPO CLI *:･ﾟ✧*:･ﾟ✧

Usage: bun repo <command> [options]

Docker Commands:
  docker:up --app <name>     Start Docker containers for an app (with profile)
  docker:down --app <name>   Stop Docker containers for an app

Database Commands:
  db:migrate --app <name>    Run Drizzle migrations for an app
  db:generate --app <name>   Generate Drizzle schema for an app
  db:seed --app <name>       Run seed script for an app
  db:push --app <name>       Push schema changes directly (no migration)

Development Commands:
  dev --app <name>           Run development server for an app
  build --app <name>         Build an app for production

Generator Commands:
  generate:app               Create a new app (TanStack or Hono)
  generate:lib               Create a new shared library

Other:
  help, --help, -h           Show this help message

Examples:
  bun repo docker:up --app web
  bun repo db:migrate --app web
  bun repo dev --app web
  bun repo generate:app
`)
}
