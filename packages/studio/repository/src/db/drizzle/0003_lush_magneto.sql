ALTER TABLE "jwks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "jwks" CASCADE;--> statement-breakpoint
-- unowned demo rows cannot be attributed to a user
DELETE FROM "todo";--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD CONSTRAINT "todo_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_message_created_at_idx" ON "chat_message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "todo_user_id_idx" ON "todo" USING btree ("user_id");