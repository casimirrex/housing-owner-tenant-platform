-- ─────────────────────────────────────────────────────────────────────────────
-- VPS migration: Tier 2 #4 — Saved Searches + Alerts
-- Date:     2026-05-08
-- Run via:  docker exec -i housing-postgres psql -U housing housing_owner_tenant < this_file.sql
-- Idempotent: every statement uses IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES (zero risk to existing data)
--
-- 1. Adds saved_searches table — tenant-saved search criteria (JSON).
-- 2. Adds saved_search_alerts table — one row per (saved_search, listing)
--    that matched. Unique constraint prevents duplicate alerts.
-- 3. Adds indexes for the two main queries:
--      • list user's saved searches
--      • list user's NEW (unread) alerts
--
-- After this:
--    • Backend ListingPromotionService is unchanged.
--    • Backend OwnerListingService.createListing fires a match check after
--      insert (best-effort try/catch — matching errors NEVER break the
--      listing creation path).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_searches (
  search_id          VARCHAR(64) PRIMARY KEY,
  user_id            VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  criteria_json      TEXT NOT NULL,
  notification_email TEXT,
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user
  ON saved_searches(user_id, active, created_at DESC);

CREATE TABLE IF NOT EXISTS saved_search_alerts (
  alert_id    VARCHAR(64) PRIMARY KEY,
  search_id   VARCHAR(64) NOT NULL REFERENCES saved_searches(search_id) ON DELETE CASCADE,
  user_id     VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  listing_id  VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','READ','DISMISSED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at     TIMESTAMPTZ,
  CONSTRAINT uniq_alert_per_search_listing UNIQUE (search_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_user_status
  ON saved_search_alerts(user_id, status, created_at DESC);

-- Verification queries:
--   \d saved_searches
--   \d saved_search_alerts
--   SELECT COUNT(*) FROM saved_searches;        -- 0 initially
--   SELECT COUNT(*) FROM saved_search_alerts;   -- 0 initially
