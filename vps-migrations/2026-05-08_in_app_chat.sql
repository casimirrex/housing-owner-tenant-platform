-- ─────────────────────────────────────────────────────────────────────────────
-- VPS migration: Tier 2 #6 — In-app Chat (polling-based)
-- Date:     2026-05-08
-- Run via:  docker exec -i housing-postgres psql -U housing housing_owner_tenant < this_file.sql
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES (zero impact on existing data)
--
-- Adds chat_threads + chat_messages tables. One thread per (listing, tenant,
-- owner) tuple — see UNIQUE constraint. Messages are plain text capped at
-- 1000 chars (CHECK constraint). Frontend polls /api/v1/chat/threads/{id}/messages
-- every 5 seconds when a chat is open — no WebSocket infrastructure needed.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_threads (
  thread_id        VARCHAR(64) PRIMARY KEY,
  listing_id       VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  tenant_id        VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  owner_id         VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  last_message_at  TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uniq_thread_per_triple UNIQUE (listing_id, tenant_id, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_tenant
  ON chat_threads(tenant_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_chat_threads_owner
  ON chat_threads(owner_id,  last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id  VARCHAR(64) PRIMARY KEY,
  thread_id   VARCHAR(64) NOT NULL REFERENCES chat_threads(thread_id) ON DELETE CASCADE,
  sender_id   VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at     TIMESTAMPTZ,
  CONSTRAINT chk_chat_content_length CHECK (char_length(content) BETWEEN 1 AND 1000)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread
  ON chat_messages(thread_id, sent_at ASC);

-- Verification:
--   \d chat_threads
--   \d chat_messages
--   SELECT COUNT(*) FROM chat_threads;   -- 0 initially
--   SELECT COUNT(*) FROM chat_messages;  -- 0 initially
