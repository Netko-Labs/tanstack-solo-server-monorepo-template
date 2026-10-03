import { toRedirectPath } from '@/shared/redirect-path'
import type { SignInSearch } from './types'

export function parseSignInSearch(search: Record<string, unknown>): SignInSearch {
  return {
    redirect: toRedirectPath(search.redirect),
    error: typeof search.error === 'string' && search.error ? search.error : undefined,
  }
}
