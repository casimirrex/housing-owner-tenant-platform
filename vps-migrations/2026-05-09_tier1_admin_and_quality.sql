-- ─────────────────────────────────────────────────────────────────────────────
-- VPS migration: Tier 1 — Admin Dashboard, Owner Reviews, Fraud Detection,
--                Locality Synonyms, and Listings.fraud_score column.
-- Date:    2026-05-09
-- Run via: docker exec -i housing-postgres psql -U housing housing_owner_tenant < this_file.sql
-- Idempotent: every statement uses IF NOT EXISTS / partial guards.
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES (zero risk to existing data)
--
-- 1. Adds owner_reviews table (tenant rates owner after a completed visit).
-- 2. Adds locality_aliases table + seeds common nicknames (HSR ↔ HSR Layout).
-- 3. Adds listings.fraud_score column for phone-reuse detection score.
-- 4. Promotes user_1a2b3c4d to ADMIN if no admin yet exists (bootstrap).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Owner reviews ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_reviews (
  review_id      VARCHAR(64) PRIMARY KEY,
  owner_id       VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reviewer_id    VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reviewer_name  TEXT NOT NULL,
  rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  headline       TEXT NOT NULL,
  comment        TEXT NOT NULL,
  visit_id       VARCHAR(64) REFERENCES visits(visit_id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (owner_id <> reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_owner_reviews_owner
  ON owner_reviews(owner_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_owner_reviews_per_visit
  ON owner_reviews(visit_id) WHERE visit_id IS NOT NULL;

-- 2) Locality aliases ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locality_aliases (
  alias       TEXT PRIMARY KEY,
  canonical   TEXT NOT NULL,
  city        TEXT
);

INSERT INTO locality_aliases (alias, canonical, city) VALUES
  -- Bengaluru
  ('hsr', 'HSR Layout', 'Bengaluru'),
  ('btm', 'BTM Layout', 'Bengaluru'),
  ('koramangala 4th block', 'Koramangala', 'Bengaluru'),
  ('koramangala 5th block', 'Koramangala', 'Bengaluru'),
  ('koramangala 6th block', 'Koramangala', 'Bengaluru'),
  ('koramangala 7th block', 'Koramangala', 'Bengaluru'),
  ('indira nagar', 'Indiranagar', 'Bengaluru'),
  ('jp nagar', 'JP Nagar', 'Bengaluru'),
  ('mg road', 'MG Road', 'Bengaluru'),
  ('whitefield ecc', 'Whitefield', 'Bengaluru'),
  ('marathahalli bridge', 'Marathahalli', 'Bengaluru'),
  -- Mumbai-area / NCR / others (helpful for cross-city searches)
  ('bandra w', 'Bandra West', NULL),
  ('bandra e', 'Bandra East', NULL),
  ('andheri w', 'Andheri West', NULL),
  ('andheri e', 'Andheri East', NULL),
  ('cp', 'Connaught Place', 'NCR-Delhi'),
  ('saket', 'Saket', 'NCR-Delhi'),
  -- Hyderabad
  ('hitec city', 'HITEC City', 'Hyderabad'),
  ('hi-tech city', 'HITEC City', 'Hyderabad'),
  ('jubilee hls', 'Jubilee Hills', 'Hyderabad'),
  -- Chennai
  ('omr', 'OMR', 'Chennai'),
  ('ecr', 'ECR', 'Chennai')
ON CONFLICT (alias) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_locality_aliases_canonical
  ON locality_aliases(canonical);

-- 3) Listings fraud score ───────────────────────────────────────────────────
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS fraud_score INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_listings_fraud
  ON listings(fraud_score DESC) WHERE fraud_score > 0;

-- 4) Bootstrap an ADMIN user (promote default user if no admin yet) ────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'ADMIN') THEN
    UPDATE users SET role = 'ADMIN' WHERE user_id = 'user_1a2b3c4d';
  END IF;
END $$;

-- Verification queries:
--   \d owner_reviews
--   \d locality_aliases
--   \d listings  (look for fraud_score column)
--   SELECT user_id, role FROM users WHERE role = 'ADMIN';
--   SELECT COUNT(*) FROM locality_aliases;  -- expect ~22
