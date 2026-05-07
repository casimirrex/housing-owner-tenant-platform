DROP TABLE IF EXISTS payment_webhook_events CASCADE;
DROP TABLE IF EXISTS payment_idempotency CASCADE;
DROP TABLE IF EXISTS document_verifications CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS rental_applications CASCADE;
DROP TABLE IF EXISTS leases CASCADE;
DROP TABLE IF EXISTS auth_sessions CASCADE;
DROP TABLE IF EXISTS auth_flows CASCADE;
DROP TABLE IF EXISTS auth_identities CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS feature_usage_events CASCADE;
DROP TABLE IF EXISTS feature_entitlements CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS wallet_accounts CASCADE;
DROP TABLE IF EXISTS payment_records CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS visit_rules CASCADE;
DROP TABLE IF EXISTS visit_slots CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS saved_search_alerts CASCADE;
DROP TABLE IF EXISTS saved_searches CASCADE;
DROP TABLE IF EXISTS lead_requests CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS saved_listings CASCADE;
DROP TABLE IF EXISTS property_faq CASCADE;
DROP TABLE IF EXISTS property_reviews CASCADE;
DROP TABLE IF EXISTS listing_trust_badges CASCADE;
DROP TABLE IF EXISTS listing_photos CASCADE;
DROP TABLE IF EXISTS listing_amenities CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS search_filter_metadata CASCADE;
DROP TABLE IF EXISTS location_suggestions CASCADE;
DROP TABLE IF EXISTS user_lifestyle_tags CASCADE;
DROP TABLE IF EXISTS user_preferred_localities CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS backend_layer CASCADE;
DROP TABLE IF EXISTS product_page_catalog CASCADE;
DROP TABLE IF EXISTS page_blueprint CASCADE;
DROP TABLE IF EXISTS support_enquiry CASCADE;
DROP TABLE IF EXISTS web_content_bullet CASCADE;
DROP TABLE IF EXISTS web_content_section CASCADE;
DROP TABLE IF EXISTS web_content_page CASCADE;
DROP TABLE IF EXISTS site_overview_shipping_note CASCADE;
DROP TABLE IF EXISTS site_overview_journey_phase CASCADE;
DROP TABLE IF EXISTS site_overview_launch_city CASCADE;
DROP TABLE IF EXISTS site_overview CASCADE;
DROP SEQUENCE IF EXISTS owner_listing_seq CASCADE;
DROP SEQUENCE IF EXISTS visit_seq CASCADE;
DROP SEQUENCE IF EXISTS payment_seq CASCADE;

CREATE SEQUENCE owner_listing_seq START WITH 2002 INCREMENT BY 1;
CREATE SEQUENCE visit_seq START WITH 1003 INCREMENT BY 1;
CREATE SEQUENCE payment_seq START WITH 3004 INCREMENT BY 1;

CREATE TABLE site_overview (
  overview_key VARCHAR(64) PRIMARY KEY,
  eyebrow TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE site_overview_launch_city (
  overview_key VARCHAR(64) NOT NULL REFERENCES site_overview(overview_key) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  city TEXT NOT NULL,
  PRIMARY KEY (overview_key, sort_order)
);

CREATE TABLE site_overview_journey_phase (
  overview_key VARCHAR(64) NOT NULL REFERENCES site_overview(overview_key) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  label TEXT NOT NULL,
  detail TEXT NOT NULL,
  PRIMARY KEY (overview_key, sort_order)
);

CREATE TABLE site_overview_shipping_note (
  overview_key VARCHAR(64) NOT NULL REFERENCES site_overview(overview_key) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  note TEXT NOT NULL,
  PRIMARY KEY (overview_key, sort_order)
);

CREATE TABLE page_blueprint (
  sort_order INTEGER PRIMARY KEY,
  page TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE product_page_catalog (
  sort_order INTEGER PRIMARY KEY,
  page TEXT NOT NULL,
  purpose TEXT NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE backend_layer (
  layer TEXT PRIMARY KEY,
  recommended_tech_stack TEXT NOT NULL,
  purpose TEXT NOT NULL
);

CREATE TABLE web_content_page (
  slug TEXT PRIMARY KEY,
  eyebrow TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_type TEXT NOT NULL,
  cta_label TEXT,
  cta_href TEXT,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE web_content_section (
  slug TEXT NOT NULL REFERENCES web_content_page(slug) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  heading TEXT NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (slug, sort_order)
);

CREATE TABLE web_content_bullet (
  slug TEXT NOT NULL,
  section_sort_order INTEGER NOT NULL,
  bullet_sort_order INTEGER NOT NULL,
  bullet TEXT NOT NULL,
  PRIMARY KEY (slug, section_sort_order, bullet_sort_order),
  FOREIGN KEY (slug, section_sort_order)
    REFERENCES web_content_section(slug, sort_order)
    ON DELETE CASCADE
);

CREATE TABLE support_enquiry (
  enquiry_id VARCHAR(64) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  city TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE users (
  user_id VARCHAR(64) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL,
  profile_status TEXT NOT NULL,
  city TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  occupation TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  employment_type TEXT,
  employer_name TEXT,
  monthly_income_range TEXT,
  previous_landlord_name TEXT,
  previous_landlord_phone TEXT,
  aadhaar_last4 CHAR(4),
  pan_card_number VARCHAR(10),
  government_id_type TEXT,
  government_id_photo_url TEXT,
  upi_id TEXT,
  photo_url TEXT,
  profile_completion INTEGER NOT NULL DEFAULT 0,
  -- Tier 1 Verified Owner Badge (Rs 199 one-time): owner-paid trust signal.
  -- Becomes a "Verified Owner" pill on every listing they own.
  verified_owner BOOLEAN NOT NULL DEFAULT FALSE,
  verified_owner_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMPTZ
);

CREATE TABLE auth_identities (
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  provider_email TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider, provider_subject)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Multi-role-per-user support (Bug F)
-- A user may hold multiple roles (e.g. both TENANT and OWNER).
-- users.role remains the "primary / currently-active" role for backward compat
-- with all existing role-gated endpoints. user_roles is the source of truth
-- for "what roles is this user entitled to use?".
-- Backfill in data.sql copies one row per existing user from users.role.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE user_roles (
  user_id    VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('TENANT', 'OWNER')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);

CREATE TABLE subscription_plans (
  plan_code VARCHAR(64) PRIMARY KEY,
  role TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  description TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  price_amount BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  validity_days INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_subscriptions (
  subscription_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  plan_code VARCHAR(64) NOT NULL REFERENCES subscription_plans(plan_code) ON DELETE RESTRICT,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  activated_via TEXT NOT NULL,
  amount_paid BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_subscriptions_user_status
  ON user_subscriptions(user_id, status, expires_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Free-trial entitlement system
--   feature_entitlements   = config (per-feature, per-tier limit)
--   feature_usage_events   = ledger (one row per consumed entitlement)
-- Premium status is NOT duplicated here — derived from user_subscriptions.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE feature_entitlements (
  feature_key   VARCHAR(64)  NOT NULL,
  plan_tier     VARCHAR(32)  NOT NULL,
  free_limit    INTEGER,                 -- NULL = unlimited (PREMIUM)
  description   TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (feature_key, plan_tier),
  CONSTRAINT chk_fe_plan_tier  CHECK (plan_tier IN ('FREE','PREMIUM')),
  CONSTRAINT chk_fe_free_limit CHECK (free_limit IS NULL OR free_limit >= 0)
);

CREATE TABLE feature_usage_events (
  user_id      VARCHAR(64)  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  feature_key  VARCHAR(64)  NOT NULL,
  resource_id  VARCHAR(64)  NOT NULL,
  occurred_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, feature_key, resource_id)
);

CREATE INDEX idx_feature_usage_user_feature
  ON feature_usage_events (user_id, feature_key, occurred_at DESC);

CREATE INDEX idx_feature_usage_recent
  ON feature_usage_events (feature_key, occurred_at DESC);

CREATE TABLE user_preferences (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  preference_profile_id VARCHAR(64) NOT NULL UNIQUE,
  budget_min INTEGER NOT NULL,
  budget_max INTEGER NOT NULL,
  bhk_preference TEXT NOT NULL,
  furnishing_preference TEXT,
  commute_location TEXT NOT NULL,
  move_in_date DATE,
  pet_friendly BOOLEAN NOT NULL,
  tenant_type TEXT NOT NULL
);

CREATE TABLE user_preferred_localities (
  user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  locality TEXT NOT NULL,
  PRIMARY KEY (user_id, sort_order)
);

CREATE TABLE user_lifestyle_tags (
  user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (user_id, sort_order)
);

CREATE TABLE location_suggestions (
  suggestion_id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  city TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL
);

CREATE TABLE search_filter_metadata (
  filter_category TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  filter_value TEXT NOT NULL,
  city TEXT,
  PRIMARY KEY (filter_category, sort_order, filter_value)
);

CREATE TABLE listings (
  listing_id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) REFERENCES users(user_id),
  owner_managed BOOLEAN NOT NULL DEFAULT FALSE,
  property_type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  city TEXT NOT NULL,
  locality TEXT NOT NULL,
  address TEXT,
  description TEXT,
  rent INTEGER NOT NULL,
  deposit INTEGER NOT NULL DEFAULT 0,
  maintenance INTEGER NOT NULL DEFAULT 0,
  brokerage INTEGER NOT NULL DEFAULT 0,
  bhk TEXT NOT NULL,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  balconies INTEGER NOT NULL DEFAULT 0,
  area_sq_ft INTEGER NOT NULL DEFAULT 0,
  furnishing TEXT NOT NULL,
  floor_no INTEGER NOT NULL DEFAULT 0,
  total_floors INTEGER NOT NULL DEFAULT 0,
  facing TEXT,
  parking TEXT,
  availability_date DATE,
  availability_status TEXT NOT NULL DEFAULT 'AVAILABLE',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  premium BOOLEAN NOT NULL DEFAULT FALSE,
  -- Featured Listings: when set in the future, the listing rises to the top of
  -- search results until this timestamp. NULL = not featured. Owners pay from
  -- their wallet via POST /api/v1/owners/listings/{id}/promote.
  featured_until TIMESTAMPTZ,
  pet_friendly BOOLEAN NOT NULL DEFAULT FALSE,
  tenant_type TEXT,
  posted_label TEXT,
  urgency_label TEXT,
  recommendation_reason TEXT,
  recommendation_score DOUBLE PRECISION,
  trending BOOLEAN NOT NULL DEFAULT FALSE,
  new_listing BOOLEAN NOT NULL DEFAULT FALSE,
  owner_name TEXT,
  owner_phone_masked TEXT,
  owner_preferred_language TEXT,
  owner_badge TEXT,
  owner_years_on_platform INTEGER NOT NULL DEFAULT 0,
  verification_label TEXT,
  owner_response_rate INTEGER NOT NULL DEFAULT 0,
  average_rating DOUBLE PRECISION NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  last_updated_label TEXT,
  can_schedule_visit BOOLEAN NOT NULL DEFAULT FALSE,
  can_call_owner BOOLEAN NOT NULL DEFAULT FALSE,
  can_chat_owner BOOLEAN NOT NULL DEFAULT FALSE,
  can_save BOOLEAN NOT NULL DEFAULT FALSE,
  can_start_kyc BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listing_amenities (
  listing_id VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  amenity TEXT NOT NULL,
  PRIMARY KEY (listing_id, sort_order)
);

CREATE TABLE listing_photos (
  listing_id VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  PRIMARY KEY (listing_id, sort_order)
);

CREATE TABLE listing_trust_badges (
  listing_id VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  badge TEXT NOT NULL,
  PRIMARY KEY (listing_id, sort_order)
);

CREATE TABLE property_reviews (
  review_id VARCHAR(64) PRIMARY KEY,
  listing_id VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  headline TEXT NOT NULL,
  comment TEXT NOT NULL,
  reviewer_type TEXT NOT NULL,
  created_at DATE NOT NULL
);

CREATE TABLE property_faq (
  listing_id VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  PRIMARY KEY (listing_id, sort_order)
);

CREATE TABLE saved_listings (
  user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  listing_id VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, listing_id)
);

-- Tier 2 #4: Saved Searches + Alerts.
-- Tenant saves search criteria; whenever a new listing matching the criteria
-- is published, an alert row is inserted. notification_email reserved for
-- future SMTP wire-up — for now alerts are surfaced in-app only.
CREATE TABLE saved_searches (
  search_id          VARCHAR(64) PRIMARY KEY,
  user_id            VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  -- Criteria JSON shape: { city, query, bhk[], furnishing, verified, rentMin, rentMax }
  criteria_json      TEXT NOT NULL,
  notification_email TEXT,
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_searches_user ON saved_searches(user_id, active, created_at DESC);

CREATE TABLE saved_search_alerts (
  alert_id    VARCHAR(64) PRIMARY KEY,
  search_id   VARCHAR(64) NOT NULL REFERENCES saved_searches(search_id) ON DELETE CASCADE,
  user_id     VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  listing_id  VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','READ','DISMISSED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at     TIMESTAMPTZ,
  -- Same listing should never alert the same saved search twice.
  CONSTRAINT uniq_alert_per_search_listing UNIQUE (search_id, listing_id)
);

CREATE INDEX idx_saved_search_alerts_user_status
  ON saved_search_alerts(user_id, status, created_at DESC);

-- Tier 1 #3: Pay-to-Contact / Express Interest leads.
-- Tenant pays Rs 49 from their wallet to express interest in a listing.
-- Owner reviews leads from the dashboard and contacts the tenant directly.
CREATE TABLE lead_requests (
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

-- Owner dashboard query: list-leads-by-owner (newest first)
CREATE INDEX idx_lead_requests_owner ON lead_requests(owner_id, created_at DESC);
-- Avoid duplicate spam: one tenant can't blast the same listing repeatedly.
-- We'll enforce in app + this index helps look up "has this tenant already led this listing?"
CREATE INDEX idx_lead_requests_tenant_listing ON lead_requests(tenant_id, listing_id, created_at DESC);

CREATE TABLE matches (
  user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  listing_id VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  match_score DOUBLE PRECISION NOT NULL,
  match_reason TEXT NOT NULL,
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE alerts (
  alert_id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  summary TEXT NOT NULL,
  is_read BOOLEAN NOT NULL,
  is_urgent BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE visit_slots (
  listing_id VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  slot_id VARCHAR(64) NOT NULL,
  slot_date DATE NOT NULL,
  label TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  available BOOLEAN NOT NULL,
  PRIMARY KEY (listing_id, slot_id, slot_date)
);

CREATE TABLE visit_rules (
  sort_order INTEGER PRIMARY KEY,
  rule_text TEXT NOT NULL
);

CREATE TABLE visits (
  visit_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  listing_id VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  slot_id VARCHAR(64) NOT NULL,
  slot_label TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE payment_records (
  payment_id VARCHAR(64) PRIMARY KEY,
  tenant_user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  owner_user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  listing_id VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  payment_kind TEXT NOT NULL,
  payment_label TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_order_id TEXT,
  provider_payment_id TEXT,
  provider_signature TEXT,
  receipt TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status TEXT NOT NULL,
  due_date DATE,
  description TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ
);

CREATE TABLE auth_flows (
  flow_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(user_id),
  channel TEXT NOT NULL,
  destination TEXT NOT NULL,
  masked_destination TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL,
  next_step TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE auth_sessions (
  access_token TEXT PRIMARY KEY,
  refresh_token TEXT NOT NULL UNIQUE,
  user_id VARCHAR(64) NOT NULL REFERENCES users(user_id),
  auth_method TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_in_seconds BIGINT NOT NULL,
  message TEXT NOT NULL,
  phase INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_owner ON listings(owner_id, owner_managed);
CREATE INDEX idx_listings_geo ON listings(city, lat, lng);
CREATE INDEX idx_listings_search ON listings(city, rent, bhk, furnishing, tenant_type, verified);
-- Featured Listings: partial index — only rows currently being boosted are
-- in the index. Search ORDER BY featured_until DESC NULLS LAST scans this
-- tiny index first, then falls through to created_at ordering for the rest.
CREATE INDEX idx_listings_featured ON listings(featured_until DESC) WHERE featured_until IS NOT NULL;
CREATE INDEX idx_listing_amenities_listing ON listing_amenities(listing_id);
CREATE INDEX idx_listing_photos_listing ON listing_photos(listing_id);
CREATE INDEX idx_property_reviews_listing ON property_reviews(listing_id);
CREATE INDEX idx_property_faq_listing ON property_faq(listing_id);
CREATE INDEX idx_saved_listings_user ON saved_listings(user_id, saved_at DESC);
CREATE INDEX idx_matches_user ON matches(user_id, match_score DESC);
CREATE INDEX idx_alerts_user ON alerts(user_id, is_read, is_urgent);
CREATE INDEX idx_visit_slots_listing ON visit_slots(listing_id, slot_date, available);
CREATE INDEX idx_visits_user_status ON visits(user_id, status, scheduled_at DESC);
CREATE INDEX idx_payment_records_tenant ON payment_records(tenant_user_id, status, due_date);
CREATE INDEX idx_payment_records_owner ON payment_records(owner_user_id, status, due_date);
CREATE INDEX idx_payment_records_listing ON payment_records(listing_id, status);
CREATE INDEX idx_payment_records_provider_order ON payment_records(provider_order_id);
CREATE INDEX idx_location_suggestions_city_label ON location_suggestions(city, label);
CREATE INDEX idx_auth_flows_destination ON auth_flows(destination, created_at DESC);
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id, created_at DESC);

/* ─── Wallet ─────────────────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS wallet_accounts (
  wallet_id     VARCHAR(64) PRIMARY KEY,
  user_id       VARCHAR(64) NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  balance       BIGINT      NOT NULL DEFAULT 0,
  currency      VARCHAR(3)  NOT NULL DEFAULT 'INR',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  txn_id              VARCHAR(64) PRIMARY KEY,
  wallet_id           VARCHAR(64) NOT NULL REFERENCES wallet_accounts(wallet_id) ON DELETE CASCADE,
  user_id             VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  txn_type            TEXT        NOT NULL,
  amount              BIGINT      NOT NULL,
  currency            VARCHAR(3)  NOT NULL DEFAULT 'INR',
  status              TEXT        NOT NULL,
  provider            TEXT        NOT NULL DEFAULT 'STRIPE',
  provider_order_id   TEXT,
  provider_payment_id TEXT,
  client_secret       TEXT,
  description         TEXT        NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user       ON wallet_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user   ON wallet_transactions(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_provider_order  ON wallet_transactions(provider_order_id);

/* ══════════════════════════════════════════════════════════════════════════
   P1  PERFORMANCE — additive indexes, trigram & full-text search
   ------------------------------------------------------------------------
   Purpose: replace LIKE '%q%' with trigram/FTS, and cover hot sort columns.
   All statements are idempotent. Safe to re-run.
   ══════════════════════════════════════════════════════════════════════════ */
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Hot feed / freshness: "newest first" and trending partial indexes
CREATE INDEX IF NOT EXISTS idx_listings_created_desc
  ON listings (created_at DESC)
  WHERE availability_status = 'AVAILABLE';

CREATE INDEX IF NOT EXISTS idx_listings_trending_partial
  ON listings (created_at DESC)
  WHERE trending = TRUE AND availability_status = 'AVAILABLE';

CREATE INDEX IF NOT EXISTS idx_listings_new_partial
  ON listings (created_at DESC)
  WHERE new_listing = TRUE AND availability_status = 'AVAILABLE';

-- Payments: hot scans of PENDING / OVERDUE
CREATE INDEX IF NOT EXISTS idx_payment_records_due_partial
  ON payment_records (due_date)
  WHERE status IN ('PENDING', 'OVERDUE');

-- Alerts inbox: unread fetch is the hot path
CREATE INDEX IF NOT EXISTS idx_alerts_user_unread
  ON alerts (user_id, created_at DESC)
  WHERE is_read = FALSE;

-- Reviews sorted by recency
CREATE INDEX IF NOT EXISTS idx_property_reviews_listing_time
  ON property_reviews (listing_id, created_at DESC);

-- Full-text search on listings: generated tsvector + GIN index
ALTER TABLE listings ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')),    'A') ||
    setweight(to_tsvector('simple', coalesce(locality, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(city, '')),     'C') ||
    setweight(to_tsvector('simple', coalesce(address, '')),  'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_listings_tsv
  ON listings USING gin (search_tsv);

-- Trigram fallbacks for fuzzy / substring (autocomplete, misspells)
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm
  ON listings USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_locality_trgm
  ON listings USING gin (locality gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_location_suggestions_label_trgm
  ON location_suggestions USING gin (label gin_trgm_ops);

/* ══════════════════════════════════════════════════════════════════════════
   P2  TENANCY CORE — leases, rental_applications, documents
   ------------------------------------------------------------------------
   These close the critical BA gaps G-1 / G-2 / G-3. All IDs use the existing
   VARCHAR(64) convention so services can generate them the same way as
   listings / payments (UUID / sequence-backed string).
   ══════════════════════════════════════════════════════════════════════════ */

-- G-2  Documents + verification (must come before leases which FKs to it)
CREATE TABLE documents (
  document_id       VARCHAR(64) PRIMARY KEY,
  owner_user_id     VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  doc_type          TEXT        NOT NULL CHECK (doc_type IN (
                      'AADHAAR','PAN','PASSPORT','DRIVING_LICENSE','PHOTO',
                      'AGREEMENT','DEPOSIT_DEDUCTION','MAINTENANCE_PHOTO','OTHER')),
  storage_key       TEXT        NOT NULL,        -- S3 / GCS object key
  original_filename TEXT,
  mime_type         TEXT        NOT NULL,
  size_bytes        BIGINT      NOT NULL,
  sha256_hex        CHAR(64)    NOT NULL,
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at        TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_documents_owner_type
  ON documents (owner_user_id, doc_type)
  WHERE deleted_at IS NULL;

CREATE TABLE document_verifications (
  verification_id VARCHAR(64) PRIMARY KEY,
  document_id     VARCHAR(64) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
  status          TEXT        NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  reviewer_id     VARCHAR(64) REFERENCES users(user_id),
  reason_code     TEXT,
  reason_detail   TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at      TIMESTAMPTZ
);
CREATE INDEX idx_docver_pending
  ON document_verifications (submitted_at)
  WHERE status = 'PENDING';
CREATE INDEX idx_docver_document
  ON document_verifications (document_id, submitted_at DESC);

-- G-1  Lease / Rental Agreement aggregate with explicit state machine
CREATE TABLE leases (
  lease_id            VARCHAR(64) PRIMARY KEY,
  listing_id          VARCHAR(64) NOT NULL REFERENCES listings(listing_id),
  owner_user_id       VARCHAR(64) NOT NULL REFERENCES users(user_id),
  tenant_user_id      VARCHAR(64) NOT NULL REFERENCES users(user_id),
  status              TEXT        NOT NULL CHECK (status IN (
                        'DRAFT','OWNER_SIGNED','TENANT_SIGNED','ACTIVE',
                        'NOTICE_SERVED','CLOSED','ARCHIVED')),
  start_date          DATE        NOT NULL,
  end_date            DATE        NOT NULL,
  notice_period_days  INTEGER     NOT NULL DEFAULT 30,
  rent_amount         INTEGER     NOT NULL,             -- minor units (paise / cents)
  deposit_amount      INTEGER     NOT NULL DEFAULT 0,
  maintenance_amount  INTEGER     NOT NULL DEFAULT 0,
  rent_due_day        SMALLINT    NOT NULL CHECK (rent_due_day BETWEEN 1 AND 28),
  currency            VARCHAR(3)  NOT NULL DEFAULT 'INR',
  agreement_doc_id    VARCHAR(64) REFERENCES documents(document_id),
  owner_signed_at     TIMESTAMPTZ,
  tenant_signed_at    TIMESTAMPTZ,
  activated_at        TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT lease_dates_valid CHECK (end_date > start_date)
);
CREATE INDEX idx_leases_tenant_active
  ON leases (tenant_user_id)
  WHERE status = 'ACTIVE';
CREATE INDEX idx_leases_owner_active
  ON leases (owner_user_id)
  WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX uq_listing_active_lease
  ON leases (listing_id)
  WHERE status = 'ACTIVE';   -- only one active lease per listing

-- Forward-link payments to leases without breaking existing rows
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS lease_id VARCHAR(64)
  REFERENCES leases(lease_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_lease
  ON payment_records (lease_id, status, due_date);

-- G-3  Rental application funnel
CREATE TABLE rental_applications (
  application_id   VARCHAR(64) PRIMARY KEY,
  listing_id       VARCHAR(64) NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  tenant_user_id   VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status           TEXT        NOT NULL CHECK (status IN (
                     'SUBMITTED','UNDER_REVIEW','SHORTLISTED','OFFERED',
                     'ACCEPTED','REJECTED','WITHDRAWN')),
  cover_note       TEXT,
  proposed_move_in DATE,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at       TIMESTAMPTZ,
  decided_by       VARCHAR(64) REFERENCES users(user_id),
  decision_reason  TEXT,
  lease_id         VARCHAR(64) REFERENCES leases(lease_id),
  CONSTRAINT uq_active_application UNIQUE (listing_id, tenant_user_id)
);
CREATE INDEX idx_apps_listing_status
  ON rental_applications (listing_id, status, submitted_at DESC);
CREATE INDEX idx_apps_tenant_status
  ON rental_applications (tenant_user_id, status, submitted_at DESC);

/* ══════════════════════════════════════════════════════════════════════════
   P3  PAYMENT RELIABILITY — idempotency + webhook event store
   ------------------------------------------------------------------------
   Closes G-5. Every POST to the payment endpoints requires an
   Idempotency-Key header. Every Stripe / Razorpay webhook is persisted
   before processing, with retry state for crash-safe reprocessing.
   ══════════════════════════════════════════════════════════════════════════ */
CREATE TABLE payment_idempotency (
  idem_key       VARCHAR(128) PRIMARY KEY,
  user_id        VARCHAR(64)  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  endpoint       TEXT         NOT NULL,
  request_hash   CHAR(64)     NOT NULL,
  response_status INTEGER     NOT NULL,
  response_json  TEXT         NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_idem_cleanup ON payment_idempotency (created_at);

CREATE TABLE payment_webhook_events (
  event_id      VARCHAR(128) PRIMARY KEY,     -- provider-supplied event id
  provider      TEXT         NOT NULL,        -- STRIPE | RAZORPAY
  event_type    TEXT         NOT NULL,
  payload_json  TEXT         NOT NULL,
  signature     TEXT,
  status        TEXT         NOT NULL CHECK (status IN (
                  'RECEIVED','PROCESSED','FAILED','DLQ')),
  attempts      INTEGER      NOT NULL DEFAULT 0,
  last_error    TEXT,
  received_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at  TIMESTAMPTZ
);
CREATE INDEX idx_webhook_retry
  ON payment_webhook_events (received_at)
  WHERE status IN ('RECEIVED','FAILED');
CREATE INDEX idx_webhook_provider_type
  ON payment_webhook_events (provider, event_type, received_at DESC);
