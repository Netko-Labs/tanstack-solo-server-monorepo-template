ALTER TABLE "passkey" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "passkey" CASCADE;--> statement-breakpoint
DROP INDEX "chat_message_created_at_idx";--> statement-breakpoint
-- existing rows predate rooms; the UI only ever used the lobby
ALTER TABLE "chat_message" ADD COLUMN "room_id" text NOT NULL DEFAULT 'lobby';--> statement-breakpoint
ALTER TABLE "chat_message" ALTER COLUMN "room_id" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "chat_message_room_created_idx" ON "chat_message" USING btree ("room_id","created_at" DESC NULLS LAST,"id");