-- ─────────────────────────────────────────────────────────────────────────────
-- VPS migration: multi-role-per-user support (Bug F)
-- Date:     2026-05-07
-- Run via:  docker exec -i housing-postgres psql -U housing housing_owner_tenant < this_file.sql
--
-- Idempotent: safe to run multiple times.
--   • CREATE TABLE IF NOT EXISTS  → no error if table already exists
--   • CREATE INDEX IF NOT EXISTS  → safe re-run
--   • INSERT ... ON CONFLICT      → no duplicate rows when re-running backfill
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES (zero risk to existing data)
--
-- 1. Adds a NEW table `user_roles` listing every (user_id, role) the user is
--    entitled to. Today every user has exactly 1 row here matching their
--    existing users.role. Tomorrow, users can add a second role (TENANT ↔ OWNER)
--    at runtime without re-registering.
--
-- 2. users.role STAYS as the "primary / currently-active" role for backward
--    compatibility with all existing role-gated endpoints. Nothing in users
--    is dropped or renamed.
--
-- 3. Backfills user_roles from current users.role so existing accounts are
--    immediately usable with no manual fix-up.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('TENANT', 'OWNER')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- Backfill: one row per existing user, matching their current role.
INSERT INTO user_roles (user_id, role, granted_at)
SELECT user_id, role, COALESCE(updated_at, CURRENT_TIMESTAMP) FROM users
ON CONFLICT (user_id, role) DO NOTHING;

-- Verification queries — run these after migration:
--   SELECT COUNT(*) AS users_total FROM users;
--   SELECT COUNT(*) AS user_roles_rows FROM user_roles;
--   -- both numbers should match (every user has exactly 1 role row).
--
--   SELECT u.user_id, u.role AS primary_role,
--          string_agg(ur.role, ', ' ORDER BY ur.role) AS available_roles
--   FROM users u JOIN user_roles ur ON ur.user_id = u.user_id
--   GROUP BY u.user_id, u.role
--   ORDER BY u.user_id LIMIT 10;
