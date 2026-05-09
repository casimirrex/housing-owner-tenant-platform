-- ─────────────────────────────────────────────────────────────────────────────
-- VPS migration: Tier 2 — Maintenance, Templates, Auto-archive, Chat, Roommates
-- Date:    2026-05-09
-- Run via: docker exec -i housing-postgres psql -U housing housing_owner_tenant < this_file.sql
-- Idempotent: every statement uses IF NOT EXISTS / ON CONFLICT guards.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Maintenance requests ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_requests (
  request_id    VARCHAR(64) PRIMARY KEY,
  listing_id    VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  tenant_id     VARCHAR(64) NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
  owner_id      VARCHAR(64) NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
  category      TEXT NOT NULL CHECK (category IN (
                  'PLUMBING','ELECTRICAL','APPLIANCE','PAINTING','PEST_CONTROL',
                  'CLEANING','CARPENTRY','OTHER')),
  priority      TEXT NOT NULL DEFAULT 'NORMAL'
                 CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'OPEN'
                 CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED','CANCELLED')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at   TIMESTAMPTZ,
  owner_note    TEXT
);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant
  ON maintenance_requests(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_owner
  ON maintenance_requests(owner_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_listing
  ON maintenance_requests(listing_id, created_at DESC);

-- 2) Listing templates ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listing_templates (
  template_id   VARCHAR(64) PRIMARY KEY,
  owner_id      VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  -- We store the template as JSON so future listing-shape changes don't
  -- require schema migrations on this table.
  payload_json  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_listing_templates_owner
  ON listing_templates(owner_id, created_at DESC);

-- 3) Chat — image attachments + read receipt visibility ────────────────────
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- read_at already exists; expose deliveries via a partial index for "is read" filters
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
  ON chat_messages(thread_id, sender_id) WHERE read_at IS NULL;

-- 4) Roommate profiles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roommate_profiles (
  profile_id        VARCHAR(64) PRIMARY KEY,
  user_id           VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  city              TEXT NOT NULL,
  preferred_areas   TEXT,
  budget_min        INTEGER,
  budget_max        INTEGER,
  move_in_date      DATE,
  gender_preference TEXT CHECK (gender_preference IN ('ANY','MALE','FEMALE','NON_BINARY')),
  occupation        TEXT,
  smoker            BOOLEAN NOT NULL DEFAULT FALSE,
  drinks            BOOLEAN NOT NULL DEFAULT FALSE,
  pet_friendly      BOOLEAN NOT NULL DEFAULT FALSE,
  vegetarian        BOOLEAN NOT NULL DEFAULT FALSE,
  early_riser       BOOLEAN NOT NULL DEFAULT FALSE,
  bio               TEXT,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uniq_roommate_profile_per_user UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_roommate_profiles_city
  ON roommate_profiles(city, active);

-- Verification queries:
--   \d maintenance_requests
--   \d listing_templates
--   \d roommate_profiles
--   \d chat_messages   (look for image_url)
