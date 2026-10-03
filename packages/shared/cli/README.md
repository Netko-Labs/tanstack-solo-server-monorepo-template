# @temp-repo/cli

Monorepo CLI for managing apps, databases, Docker, and development workflows.

## Installation

The CLI is automatically available when you install the monorepo dependencies.

## Usage

```bash
bun run repo <command> [options]
```

Or use the convenience scripts in the root package.json:

```bash
bun run dev          # dev --app studio
bun run test         # test (studio's .env)
bun run status       # Show monorepo status
```

## Commands

### Development

| Command | Description |
|---------|-------------|
| `dev --app <name>` | Docker up, `db:generate`, `db:migrate`, then the dev server (needs `apps/<name>/.env`) |
| `serve --app <name>` | Start the dev server only (checks the nitro patch first) |
| `build --app <name>` | Build for production |
| `check:nitro-patch --app <name>` | Fail unless `patches/nitro@*.patch` reached the installed nitro (`serve` runs it first) |

### Docker

| Command | Description |
|---------|-------------|
| `docker:up --app <name>` | Start Docker containers |
| `docker:down --app <name>` | Stop Docker containers |

### Database

| Command | Description |
|---------|-------------|
| `db:migrate --app <name>` | Run database migrations |
| `db:generate --app <name>` | Generate migrations from schema |
| `db:push --app <name>` | Push schema changes (no migration) |
| `db:seed --app <name>` | Run the re-runnable dev seed (refuses in production) |
| `db:studio --app <name>` | Open Drizzle Studio GUI |

### Generators

| Command | Description |
|---------|-------------|
| `generate:app` | Create a new app |
| `generate:lib` | Create a shared library (`library` kind) or an external-service client (`client` kind) |

### Testing

| Command | Description |
|---------|-------------|
| `test [--app <name>]` | Run tests with the app's `.env` loaded under the shell env (`studio` by default); with `--app`, warns when no workspace under it has a test script |
| `test --watch` | Run tests in watch mode |
| `test --coverage` | Run tests with coverage |
| `test:smoke [--app <name>]` | Boot the built server (`build` first) in production mode on :4790 and probe health, SSR, tRPC and the socket (`__tests__/smoke.ts`) |

### Utilities

| Command | Description |
|---------|-------------|
| `status` | Show monorepo status (docker, ports, apps) |
| `info --app <name>` | Show detailed app information |
| `logs --app <name>` | View Docker container logs |
| `logs -f` | Follow logs in real-time |
| `clean` | Remove build artifacts and caches |
| `reset --app <name>` | Reset app (fresh start) |

### Project

| Command | Description |
|---------|-------------|
| `rename <new-scope>` | Rename the `@temp-repo` scope and every `temp-repo` name (e.g. `@my-company`); re-copy `apps/*/.env` from `sample.env` afterwards |
| `rename:preview <scope>` | Preview rename changes |

## Examples

```bash
# Start development for studio app
bun run repo dev --app studio

# Open database GUI
bun run repo db:studio --app studio

# Run tests with coverage
bun run repo test --coverage

# Follow Docker logs
bun run repo logs --app studio -f

# Reset app to fresh state
bun run repo reset --app studio

# Create a new app
bun run repo generate:app
```

## Options

| Option | Description |
|--------|-------------|
| `--app, -a <name>` | Specify target app |
| `--help, -h` | Show help message |
