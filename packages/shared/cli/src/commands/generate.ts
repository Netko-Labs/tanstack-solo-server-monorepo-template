import { getRootDir, run } from '../utils/shell'

/**
 * Generate a new app using turbo gen
 */
export async function generateApp() {
  console.log('🏗️  Starting app generator...')

  await run(['turbo', 'gen', 'app'], {
    cwd: getRootDir(),
  })

  console.log(`
✅ App generated successfully!

Next steps:
1. Run 'bun install' to install dependencies
2. Copy 'apps/<app-name>/sample.env' to 'apps/<app-name>/.env' and configure
3. Run 'bun run repo docker:up --app <app-name>' to start Docker containers
4. Run 'bun run repo db:migrate --app <app-name>' to run migrations
5. Run 'bun run repo dev --app <app-name>' to start the development server
`)
}

/**
 * Generate a shared library or an external-service client using turbo gen
 */
export async function generateLib() {
  console.log('🏗️  Starting library generator...')

  await run(['turbo', 'gen', 'lib'], {
    cwd: getRootDir(),
  })

  console.log(`
✅ Library generated successfully!

Next steps:
1. Run 'bun install' to install dependencies
2. library kind: add code under 'packages/shared/<name>/src/', exported through its index.ts
   client kind: replace ping() in 'packages/shared/<name>-client/src/' with the service's calls;
   service builds the client once from app config (see "External services" in docs/conventions.md)
`)
}
