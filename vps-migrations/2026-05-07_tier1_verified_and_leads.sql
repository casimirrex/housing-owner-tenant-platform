-- ─────────────────────────────────────────────────────────────────────────────
-- VPS migration: Tier 1 features
--   #2 Verified Owner Badge — adds users.verified_owner + verified_owner_at
--   #3 Pay-to-Contact       — new lead_requests table + indexes
--
-- Date:     2026-05-07
-- Run via:  docker exec -i housing-postgres psql -U housing housing_owner_tenant < this_file.sql
-- Idempotent: every statement uses IF NOT EXISTS / DO NOTHING patterns.
-- ─────────────────────────────────────────────────────────────────────────────

-- #2 Verified Owner Badge — additive columns on users (NULL safe)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verified_owner BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_owner_at TIMESTAMPTZ;

-- #3 Pay-to-Contact — lead requests
CREATE TABLE IF NOT EXISTS lead_requests (
  lead_id      VARCHAR(64) PRIMARY KEY,
  tenant_id    VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  listing_id   VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  owner_id     VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message      TEXT,
  amount_paid  BIGINT NOT NULL,
  currency     VARCHAR(3) NOT NULL DEFAULT 'INR',
  status       TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','VIEWED','RESPONDED','ARCHIVED')),
  payment_reference TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_requests_owner
  ON lead_requests(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_requests_tenant_listing
  ON lead_requests(tenant_id, listing_id, created_at DESC);

-- Verification queries (run after migration):
--   \d users                              -- confirm verified_owner + verified_owner_at appear
--   \d lead_requests                       -- confirm table created
--   SELECT COUNT(*) FROM users WHERE verified_owner = true;  -- should be 0 initially
--   SELECT COUNT(*) FROM lead_requests;                       -- should be 0 initially
