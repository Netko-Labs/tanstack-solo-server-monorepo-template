export interface RunOptions {
  cwd?: string
  env?: Record<string, string>
}

/** The slice of `turbo run --dry=json` the CLI reads. */
export interface TurboDryRun {
  tasks?: { taskId: string; command: string }[]
}
