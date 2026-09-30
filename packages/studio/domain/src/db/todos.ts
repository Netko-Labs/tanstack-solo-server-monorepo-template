import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const todoTable = pgTable(
  'todo',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    completed: boolean('completed').default(false).notNull(),
    createdAt: timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updated_at')
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('todo_user_id_idx').on(table.userId)],
)
