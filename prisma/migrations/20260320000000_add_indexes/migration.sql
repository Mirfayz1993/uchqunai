-- AddIndexes: Performance indexes for common query patterns

-- conversations: userId lookups (list user's conversations)
CREATE INDEX IF NOT EXISTS "conversations_user_id_idx" ON "conversations"("user_id");

-- conversations: botId lookups
CREATE INDEX IF NOT EXISTS "conversations_bot_id_idx" ON "conversations"("bot_id");

-- conversations: userId + updatedAt for sorted listing
CREATE INDEX IF NOT EXISTS "conversations_user_id_updated_at_idx" ON "conversations"("user_id", "updated_at" DESC);

-- messages: conversationId + createdAt for ordered history
CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at" ASC);

-- documents: botId lookups (RAG search filter)
CREATE INDEX IF NOT EXISTS "documents_bot_id_idx" ON "documents"("bot_id");

-- reminders: userId lookups
CREATE INDEX IF NOT EXISTS "reminders_user_id_idx" ON "reminders"("user_id");

-- reminders: cron job — notified=false + remindAt window scan
CREATE INDEX IF NOT EXISTS "reminders_notified_remind_at_idx" ON "reminders"("notified", "remind_at");

-- push_subscriptions: userId lookups
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");
