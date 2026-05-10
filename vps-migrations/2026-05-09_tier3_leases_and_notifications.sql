-- ─────────────────────────────────────────────────────────────────────────────
-- VPS migration: Tier 3 — Tenant lease tracker
-- Date:    2026-05-09
-- Run via: docker exec -i housing-postgres psql -U housing housing_owner_tenant < this_file.sql
-- Idempotent: every statement uses IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Notifications endpoint (Tier 3) requires no schema change — it projects
-- from existing tables, so this migration only covers the lease tracker.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_leases (
  lease_id        VARCHAR(64) PRIMARY KEY,
  tenant_id       VARCHAR(64) NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
  listing_id      VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  owner_id        VARCHAR(64) NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  monthly_rent    INTEGER NOT NULL CHECK (monthly_rent > 0),
  security_deposit INTEGER NOT NULL DEFAULT 0,
  document_url    TEXT,
  status          TEXT NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE','ENDED','TERMINATED')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_tenant_leases_tenant
  ON tenant_leases(tenant_id, status, end_date);

CREATE INDEX IF NOT EXISTS idx_tenant_leases_owner
  ON tenant_leases(owner_id, status, end_date);

-- Verification queries:
--   \d tenant_leases
--   SELECT COUNT(*) FROM tenant_leases;
