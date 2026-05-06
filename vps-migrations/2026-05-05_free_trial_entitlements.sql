-- ─────────────────────────────────────────────────────────────────────────────
-- VPS migration: free-trial entitlement system
-- Date:     2026-05-05
-- Run via:  docker exec -i housing-postgres psql -U housing housing_owner_tenant < this_file.sql
--
-- Idempotent: safe to run multiple times.
--   • CREATE TABLE IF NOT EXISTS  → no error if tables already exist
--   • INSERT ... ON CONFLICT       → no duplicate rows on re-run
--
-- This file ONLY adds new tables. It does NOT modify or drop any existing
-- tables. Production data is preserved.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feature_entitlements (
  feature_key   VARCHAR(64)  NOT NULL,
  plan_tier     VARCHAR(32)  NOT NULL,
  free_limit    INTEGER,
  description   TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (feature_key, plan_tier),
  CONSTRAINT chk_fe_plan_tier  CHECK (plan_tier IN ('FREE','PREMIUM')),
  CONSTRAINT chk_fe_free_limit CHECK (free_limit IS NULL OR free_limit >= 0)
);

CREATE TABLE IF NOT EXISTS feature_usage_events (
  user_id      VARCHAR(64)  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  feature_key  VARCHAR(64)  NOT NULL,
  resource_id  VARCHAR(64)  NOT NULL,
  occurred_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, feature_key, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature
  ON feature_usage_events (user_id, feature_key, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_usage_recent
  ON feature_usage_events (feature_key, occurred_at DESC);

INSERT INTO feature_entitlements (feature_key, plan_tier, free_limit, description) VALUES
  ('OWNER_LISTING_POST',   'FREE',    3,    'Owner can publish 3 listings on free tier'),
  ('OWNER_LISTING_POST',   'PREMIUM', NULL, 'Owner premium: unlimited listings'),
  ('TENANT_PROPERTY_VIEW', 'FREE',    3,    'Tenant can view full details of 3 unique properties on free tier'),
  ('TENANT_PROPERTY_VIEW', 'PREMIUM', NULL, 'Tenant premium: unlimited property views')
ON CONFLICT (feature_key, plan_tier) DO NOTHING;

-- Verification queries — run these after migration:
--   SELECT * FROM feature_entitlements ORDER BY feature_key, plan_tier;
--   SELECT COUNT(*) FROM feature_usage_events;  -- should be 0 initially
