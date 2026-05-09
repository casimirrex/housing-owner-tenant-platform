-- ─────────────────────────────────────────────────────────────────────────────
-- VPS migration: Tier 0 trust & safety bundle
--   • listing_reports        — "Report listing" flow
--   • user_blocks            — Block another user (chat + listings hide)
--   • reviews.visit_id       — Verified-stay review gating (link review→visit)
-- Date:    2026-05-09
-- Run via: docker exec -i housing-postgres psql -U housing housing_owner_tenant < this_file.sql
-- Idempotent: every statement is IF NOT EXISTS / NOT EXISTS-guarded.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) listing_reports ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listing_reports (
  report_id        VARCHAR(64) PRIMARY KEY,
  listing_id       VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  reporter_user_id VARCHAR(64) NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
  reason           TEXT NOT NULL CHECK (reason IN (
    'FAKE_LISTING','WRONG_INFORMATION','SPAM','SCAM_OR_FRAUD',
    'OFFENSIVE_CONTENT','ALREADY_RENTED','DUPLICATE','OTHER'
  )),
  details          TEXT,
  status           TEXT NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN','IN_REVIEW','RESOLVED','DISMISSED')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at      TIMESTAMPTZ,
  reviewer_user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE SET NULL,
  resolution_note  TEXT
);

CREATE INDEX IF NOT EXISTS idx_listing_reports_listing
  ON listing_reports(listing_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_reports_status
  ON listing_reports(status, created_at DESC);

-- One open report per (listing, reporter) — re-reports just update existing row.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_listing_reports_open_per_reporter
  ON listing_reports(listing_id, reporter_user_id)
  WHERE status = 'OPEN';

-- 2) user_blocks ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  blocked_user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_user_id, blocked_user_id),
  CHECK (blocker_user_id <> blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked
  ON user_blocks(blocked_user_id);

-- 3) property_reviews.visit_id  (verified-stay gating) ─────────────────────
ALTER TABLE property_reviews
  ADD COLUMN IF NOT EXISTS visit_id VARCHAR(64) REFERENCES visits(visit_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_property_reviews_visit
  ON property_reviews(visit_id) WHERE visit_id IS NOT NULL;

-- Verification queries:
--   \d listing_reports
--   \d user_blocks
--   \d property_reviews
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='property_reviews' AND column_name='visit_id';
