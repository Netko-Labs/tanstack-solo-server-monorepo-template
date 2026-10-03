import { TODO_DESCRIPTION_MAX, TODO_TITLE_MAX, type TodoErrorCode } from '@temp-repo/studio-domain'
import type { TodoDraft } from './types'

export const TODOS_PAGE_TITLE = 'Todos Example'
export const TODOS_PAGE_DESCRIPTION =
  'Demonstrating tRPC + TanStack Query with queries and mutations over HTTP'
export const TODOS_SIGNED_IN_AS = 'Signed in as'

export const TRANSPORT_TITLE = 'Transport'
export const TRANSPORT_DESCRIPTION =
  'Queries and mutations batch over /api/trpc; the WebSocket is reserved for subscriptions'
export const TRANSPORT_BADGE = 'HTTP batch'

export const CREATE_TODO_TITLE = 'Create New Todo'
export const CREATE_TODO_DESCRIPTION = 'Add a new item to your todo list'
export const CREATE_TODO_TITLE_LABEL = 'Title'
export const CREATE_TODO_TITLE_PLACEHOLDER = 'Enter todo title'
export const CREATE_TODO_DESCRIPTION_LABEL = 'Description (optional)'
export const CREATE_TODO_DESCRIPTION_PLACEHOLDER = 'Enter todo description'
export const CREATE_TODO_SUBMIT_LABEL = 'Add Todo'
export const CREATE_TODO_PENDING_LABEL = 'Adding...'

export const EMPTY_TODO_DRAFT: TodoDraft = { title: '', description: '' }

export const TODO_TITLE_ISSUE = `Give the todo a title of up to ${TODO_TITLE_MAX} characters.`
export const TODO_DESCRIPTION_ISSUE = `Keep the description under ${TODO_DESCRIPTION_MAX} characters.`
export const TODO_INPUT_ISSUE = 'Check the todo and try again.'

export const TODO_ERROR_COPY: Record<TodoErrorCode, string> = {
  not_found: 'That todo was already deleted.',
}

export const LIST_TITLE = 'Your Todos'
export const LIST_EMPTY = 'No todos yet. Create one above!'
export const LIST_ERROR_TITLE = 'Could not load your todos'
export const LIST_RETRY = 'Try again'
export const TODO_DELETE_LABEL = 'Delete'
export const TODO_CREATED_LABEL = 'Created:'

export const IMPLEMENTATION_TITLE = 'Implementation Details'
export const IMPLEMENTATION_QUERY =
  'One mutationOptions hook per action; each write invalidates the list, so the view shows what the server stored.'
export const IMPLEMENTATION_TRANSPORT =
  'Queries and mutations batch over HTTP (/api/trpc); only subscriptions use the WebSocket.'
export const IMPLEMENTATION_HINT =
  'The page sits under an _authed layout route; every procedure is scoped to the signed-in user.'
