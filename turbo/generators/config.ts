import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { PlopTypes } from '@turbo/gen'

const NAME_PATTERN = /^[a-z][a-z0-9-]*$/
const RESERVED_APP_NAMES = ['shared', 'configs', 'clients']
const APP_LAYERS = ['domain', 'service', 'repository', 'trpc']

const splitWords = (text: string) => text.split(/[-_\s]+/)
const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
const toPascalCase = (text: string) => splitWords(text).map(capitalize).join('')
const toConstantCase = (text: string) =>
  splitWords(text)
    .map((word) => word.toUpperCase())
    .join('_')

const validateName = (kind: string, input: string): string | true => {
  if (!input || input.trim() === '') return `${kind} name is required`
  if (!NAME_PATTERN.test(input)) {
    return `${kind} name must start with a letter and contain only lowercase letters, numbers, and hyphens`
  }
  return true
}

const scaffold = (template: string, destination: string): PlopTypes.ActionType => ({
  type: 'addMany',
  destination: `{{ turbo.paths.root }}/${destination}`,
  base: `templates/${template}`,
  templateFiles: `templates/${template}/**/*`,
  globOptions: { dot: true },
})

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  const root = plop.getDestBasePath()
  const exists = (...segments: string[]) => existsSync(join(root, ...segments))

  // Biome does not read .hbs, so generated code is formatted (and its imports sorted) here;
  // a lint error biome cannot fix fails the generator instead of the first commit.
  const format =
    (folders: (answers: PlopTypes.Answers) => string[]): PlopTypes.ActionType =>
    (answers) => {
      const targets = folders(answers)
      execSync(`bunx biome check --write ${targets.join(' ')}`, { cwd: root, stdio: 'inherit' })
      return `formatted ${targets.join(', ')}`
    }

  plop.setHelper('pascalCase', toPascalCase)
  plop.setHelper('camelCase', (text: string) => {
    const pascal = toPascalCase(text)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  })
  plop.setHelper('constantCase', toConstantCase)

  // "${" + "{{ ... }}" would collide with Handlebars, so the compose port mapping is a helper.
  plop.setHelper(
    'dockerPort',
    (name: string, envSuffix: string, hostDefault: string, container: string) =>
      `\${${toConstantCase(name)}_${envSuffix}:-${hostDefault}}:${container}`,
  )

  plop.setGenerator('app', {
    description:
      'Create a new application with domain, service, repository, trpc, and config packages',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the new app?',
        validate: (input: string) => {
          const valid = validateName('App', input)
          if (valid !== true) return valid
          if (RESERVED_APP_NAMES.includes(input)) {
            return `"${input}" is a reserved workspace folder under packages/; pick another name`
          }
          if (exists('apps', input) || exists('packages', input)) {
            return `apps/${input} or packages/${input} already exists`
          }
          return true
        },
      },
    ],
    actions: [
      scaffold('app-tanstack/app', 'apps/{{ name }}'),
      ...APP_LAYERS.map((layer) =>
        scaffold(`app-tanstack/${layer}`, `packages/{{ name }}/${layer}`),
      ),
      scaffold('app-tanstack/config', 'packages/configs/{{ name }}-config'),
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/package.json',
        transform: (content: string, answers: PlopTypes.Answers) => {
          const pkg = JSON.parse(content)
          const workspace = `packages/${answers.name}/*`
          if (!pkg.workspaces.includes(workspace)) pkg.workspaces.push(workspace)
          return `${JSON.stringify(pkg, null, 2)}\n`
        },
      },
      format(({ name }) => [`apps/${name}`, `packages/${name}`, `packages/configs/${name}-config`]),
    ],
  })

  plop.setGenerator('lib', {
    description: 'Create a shared library or an external-service client in packages/shared/',
    prompts: [
      {
        type: 'list',
        name: 'kind',
        message: 'What kind of package?',
        choices: [
          { name: 'Library — shared code', value: 'library' },
          {
            name: 'Client — one external service ({name}-client, transport only)',
            value: 'client',
          },
        ],
      },
      {
        type: 'input',
        name: 'name',
        message: 'Name (for a client, the service only: "stripe" → stripe-client)?',
        validate: (input: string, answers?: PlopTypes.Answers) => {
          const valid = validateName('Library', input)
          if (valid !== true) return valid
          if (input.endsWith('-client')) return 'Leave out "-client"; the client kind adds it'
          const folder = answers?.kind === 'client' ? `${input}-client` : input
          if (exists('packages', 'shared', folder))
            return `packages/shared/${folder} already exists`
          return true
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Brief description of the library:',
        default: 'A shared library',
      },
    ],
    actions: (answers) => {
      const isClient = answers?.kind === 'client'
      const folder = `packages/shared/${answers?.name}${isClient ? '-client' : ''}`
      return [
        isClient
          ? scaffold('shared-client/client', 'packages/shared/{{ name }}-client')
          : scaffold('shared-lib/lib', 'packages/shared/{{ name }}'),
        format(() => [folder]),
      ]
    },
  })
}
