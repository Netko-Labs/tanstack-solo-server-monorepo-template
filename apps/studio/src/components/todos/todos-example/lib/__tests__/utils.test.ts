import { describe, expect, test } from 'bun:test'
import { TodoCreateInputSchema } from '@temp-repo/studio-domain'
import { TRPCClientError } from '@trpc/client'
import { todoErrorMessage, todoIdOf, todoIssueMessage, toTodoCreateInput } from '../utils'
import { TODO_DESCRIPTION_ISSUE, TODO_ERROR_COPY, TODO_TITLE_ISSUE } from '../values'

const issuesOf = (title: string, description = '') => {
  const parsed = TodoCreateInputSchema.safeParse(toTodoCreateInput({ title, description }))
  return parsed.success ? [] : parsed.error.issues
}

describe('create todo validation', () => {
  test('the domain schema gates the form; the first issue becomes one line of copy', () => {
    expect(issuesOf('Buy milk')).toEqual([])
    expect(todoIssueMessage(issuesOf('   '))).toBe(TODO_TITLE_ISSUE)
    expect(todoIssueMessage(issuesOf('x'.repeat(201)))).toBe(TODO_TITLE_ISSUE)
    expect(todoIssueMessage(issuesOf('ok', 'x'.repeat(2001)))).toBe(TODO_DESCRIPTION_ISSUE)
  })

  test('an empty description is sent as null', () => {
    expect(toTodoCreateInput({ title: ' a ', description: '  ' })).toEqual({
      title: 'a',
      description: null,
    })
  })
})

describe('todo errors', () => {
  test('a not_found service code reads as todo copy', () => {
    const error = TRPCClientError.from({
      error: { message: 'not_found', code: -32004, data: { code: 'NOT_FOUND' } },
    })
    expect(todoErrorMessage(error)).toBe(TODO_ERROR_COPY.not_found)
  })

  test('row ids come out of untyped mutation variables safely', () => {
    expect(todoIdOf({ todoId: 't1', completed: true })).toBe('t1')
    expect(todoIdOf({ todoId: 1 })).toBeUndefined()
    expect(todoIdOf(undefined)).toBeUndefined()
  })
})
