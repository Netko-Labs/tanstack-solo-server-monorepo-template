import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const chatMessageTable = pgTable(
  'chat_message',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    content: text('content').notNull(),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    authorName: text('author_name').notNull(),
    createdAt: timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index('chat_message_created_at_idx').on(table.createdAt)],
)
