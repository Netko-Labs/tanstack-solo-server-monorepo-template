import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const chatMessageTable = pgTable(
  'chat_message',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    roomId: text('room_id').notNull(),
    content: text('content').notNull(),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    authorName: text('author_name').notNull(),
    createdAt: timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index('chat_message_room_created_idx').on(table.roomId, table.createdAt.desc(), table.id),
  ],
)
