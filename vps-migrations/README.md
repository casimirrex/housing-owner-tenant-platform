# VPS migrations

Manual SQL migrations for the production VPS database.

## Why this folder exists

The local dev environment runs `schema.sql` on every backend startup
(`spring.sql.init.mode=always`), which DROPs and recreates all tables. That's
fine for local dev — data is meant to reset to seed state.

Production VPS runs with `SQL_INIT_MODE=never` (set in `docker-compose.prod.yml`)
so `schema.sql` is **not** auto-applied. This preserves real user data across
deploys. The trade-off: any new schema change must be applied manually here.

## How to apply a migration on VPS

1. SSH into the VPS.
2. Copy the migration file into the postgres container, or pipe it directly:
   ```bash
   docker exec -i housing-postgres psql -U housing housing_owner_tenant \
     < vps-migrations/2026-05-05_free_trial_entitlements.sql
   ```
3. Verify with the SELECT queries at the bottom of the migration file.

All migrations here are written to be **idempotent** — safe to re-run if you
aren't sure whether they were applied.

## Naming convention

`YYYY-MM-DD_brief_description.sql` — date-prefixed, lower_snake_case.

## When to add a new migration

Any time `schema.sql` gets a new `CREATE TABLE`, `ALTER TABLE`, or `CREATE INDEX`
that production needs.
