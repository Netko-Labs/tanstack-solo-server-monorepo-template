/**
 * ✧･ﾟ: *✧･ﾟ:* ENVIRONMENT SETUP *:･ﾟ✧*:･ﾟ✧
 *
 * Sets up required environment variables for TanStack Start.
 * Making sure everyone has what they need! (◕‿◕✿)
 */

/**
 * Configures environment variables for TanStack Start ✨
 * TanStack Start needs these to work properly ヨシ!
 */
export function setupTanStackStartEnv(): void {
  // TanStack Start requires this for server function endpoints (◕‿◕)
  process.env.TSS_SERVER_FN_BASE = process.env.TSS_SERVER_FN_BASE || '/_server'
}

