-- ─────────────────────────────────────────────────────────────────────────────
-- VPS migration: Featured Listings (paid listing promotion)
-- Date:     2026-05-07
-- Run via:  docker exec -i housing-postgres psql -U housing housing_owner_tenant < this_file.sql
--
-- Idempotent: safe to run multiple times.
--   • ALTER TABLE ... ADD COLUMN IF NOT EXISTS  → no error if column exists
--   • CREATE INDEX IF NOT EXISTS                → safe re-run
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES (zero risk to existing data)
--
-- 1. Adds `featured_until` (TIMESTAMPTZ NULL) to listings. Existing listings
--    get NULL — meaning they are NOT currently featured, which matches their
--    current behaviour exactly.
--
-- 2. Adds a partial index on featured_until for fast "is this listing currently
--    featured?" lookups during search ranking.
--
-- 3. Backend code (after deploy) starts ordering search results so that any
--    listing with featured_until > now() rises above non-featured ones. The
--    rest of the search ordering is unchanged.
--
-- 4. Owners pay from their wallet to set featured_until via the new
--    POST /api/v1/owners/listings/{id}/promote endpoint.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_listings_featured
  ON listings(featured_until DESC)
  WHERE featured_until IS NOT NULL;

-- Verification queries — run these after migration:
--   \d listings   -- confirm featured_until column appears
--   SELECT COUNT(*) AS featured_now FROM listings WHERE featured_until > now();
--   -- should return 0 immediately after migration (no listings featured yet).
