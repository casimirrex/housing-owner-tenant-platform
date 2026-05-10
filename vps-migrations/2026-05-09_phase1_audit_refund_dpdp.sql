-- ─────────────────────────────────────────────────────────────────────────────
-- VPS migration: Phase 1 free features
--   • audit_log              — admin/system action trail
--   • wallet_refunds         — admin-issued refund tracking
--   • account_deletion_requests — DPDP-compliant account deletion queue
-- Date:    2026-05-09
-- Run via: docker exec -i housing-postgres psql -U housing housing_owner_tenant < this_file.sql
-- Idempotent: every statement is IF NOT EXISTS guarded.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id    VARCHAR(64) PRIMARY KEY,
  actor_user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE SET NULL,
  actor_role  TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  payload     TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor    ON audit_log(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action   ON audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity   ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_recent   ON audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS wallet_refunds (
  refund_id          VARCHAR(64) PRIMARY KEY,
  user_id            VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  amount_paise       BIGINT NOT NULL CHECK (amount_paise > 0),
  reason             TEXT NOT NULL,
  reference_payment  TEXT,
  initiated_by_admin VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  status             TEXT NOT NULL DEFAULT 'COMPLETED'
                       CHECK (status IN ('COMPLETED','FAILED')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wallet_refunds_user ON wallet_refunds(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_refunds_admin ON wallet_refunds(initiated_by_admin, created_at DESC);

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  request_id   VARCHAR(64) PRIMARY KEY,
  user_id      VARCHAR(64) NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'PENDING'
                 CHECK (status IN ('PENDING','COMPLETED','CANCELLED')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completes_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_account_deletion_status
  ON account_deletion_requests(status, completes_at);
