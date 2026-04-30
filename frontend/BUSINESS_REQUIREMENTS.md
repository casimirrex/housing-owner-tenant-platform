# Housing Owner–Tenant Platform — Business Requirements Document (BRD)

**Author:** Business Analyst (acting)
**Version:** 0.2 — Draft for review
**Date:** 30 April 2026
**Status:** Awaiting stakeholder sign-off — no coding to begin until this is approved.

> **Change in v0.2:** Introduces a strict **two-workspace architecture** — `Owner Workspace` and `Tenant Workspace` — each with its own dedicated registration and login pages. Owners get full property CRUD (Create, List, Edit, Remove) inside the Owner Workspace, and properties published by owners flow into the Tenant Workspace search & discovery surface in real time.

---

## 1. Executive Summary

The Housing Owner–Tenant Platform is a two-sided digital marketplace that connects **property owners / landlords** with **prospective tenants** for short, medium, and long-term residential rentals. The platform removes traditional brokerage friction by allowing owners to self-list, tenants to self-search, and both parties to transact, communicate, and document the rental relationship through a single secure web application.

The product is delivered through **two distinct workspaces** that share a common public marketing surface but are otherwise fully separated:

- **Owner Workspace** — at `/owner/*`. Has its own registration, login, dashboard, and property management tools (add / list / edit / remove).
- **Tenant Workspace** — at `/tenant/*`. Has its own registration, login, dashboard, search, shortlist, payments, and wallet.

Properties published by an owner inside the Owner Workspace become immediately discoverable inside the Tenant Workspace through the shared search index. A user account belongs to exactly one workspace role (owner *or* tenant) at any given time.

The web application is the primary tenant-facing and owner-facing surface. It is backed by a Spring Boot REST API. This BRD scopes **the web application only** — backend obligations are referenced where the web app depends on them.

---

## 2. Business Objectives

| # | Objective | Success Indicator |
|---|-----------|-------------------|
| O1 | Enable tenants to discover rentals without a broker | Time-to-shortlist < 5 minutes from landing |
| O2 | Enable owners to list properties in under 10 minutes | Listing-create completion rate ≥ 70% |
| O3 | Capture qualified leads via verified accounts | Verified-email rate ≥ 90% of registrations |
| O4 | Offer a transparent in-platform payment + wallet experience | First-payment-success rate ≥ 95% |
| O5 | Build trust through reviews, FAQs, and verified property data | Review submission rate ≥ 25% post-tenancy |

---

## 3. Stakeholders & User Personas

### 3.1 External Personas

| Persona | Description | Primary Goals |
|---------|-------------|---------------|
| **Tenant (Renter)** | Working professionals, students, families looking for a rental | Find, shortlist, contact owner, pay deposit/rent |
| **Owner (Landlord)** | Individuals or small landlords with 1–N properties | List property, manage tenants, receive payments |
| **Anonymous visitor** | Has not registered yet | Browse, search, read content pages |
| **Support requester** | Anyone using the contact form | Resolve issues, ask pre-sales questions |

### 3.2 Internal Stakeholders

- Product Owner — final scope authority
- Engineering — frontend (this repo), backend API, infra
- Customer Support — handles enquiries submitted via `/contact`
- Compliance / Legal — owns Privacy Policy & Terms content
- Finance / Ops — payment reconciliation

---

## 4. Scope

### 4.1 In-Scope (Phase 1 — MVP)

1. **Public surface** (no auth required): Landing, City landing, Property detail, Search, How-it-works, About, Contact, Privacy, Terms.
2. **Owner Workspace** (`/owner/*`):
   - Dedicated **owner registration** page (`/owner/register`)
   - Dedicated **owner login** page (`/owner/login`)
   - Owner dashboard (`/owner/dashboard`) with KPIs (views, shortlists, enquiries, active listings)
   - Listings management (`/owner/listings`) — list view of all properties owned by the user
   - **Add property** flow (`/owner/listings/new`) — multi-step form
   - **Edit property** flow (`/owner/listings/[propertyId]/edit`)
   - **Remove property** action (soft delete, with confirm dialog)
   - Owner profile / settings
3. **Tenant Workspace** (`/tenant/*`):
   - Dedicated **tenant registration** page (`/tenant/register`)
   - Dedicated **tenant login** page (`/tenant/login`)
   - Tenant dashboard (`/tenant/dashboard`) with shortlist, recent searches, payment history
   - Discovery: search, filters, property detail (reuses public detail page with extra "Save / Contact owner / Pay" CTAs once authenticated)
   - Shortlist
   - Wallet & Payments
4. **Cross-workspace data flow**: Properties published by any owner appear in the tenant search results and on the public landing/city pages within seconds (eventual-consistency window ≤ 30s).
5. Support enquiry submission to backend (`/contact`).

### 4.2 Out-of-Scope (this phase — explicit)

- Native mobile apps (iOS/Android)
- Owner KYC document upload & verification workflow (UI only, no review tooling)
- In-app messaging / chat between owner and tenant
- Lease e-signature
- Admin / back-office console
- Multi-currency / international expansion
- Refund disputes UI
- A single user holding both Owner and Tenant roles simultaneously (a workspace switcher) — Phase 2

### 4.3 Workspace Architecture

| Concern | Public surface | Owner Workspace | Tenant Workspace |
|---------|----------------|-----------------|------------------|
| Route prefix | `/` | `/owner/*` | `/tenant/*` |
| Registration page | n/a | `/owner/register` | `/tenant/register` |
| Login page | n/a | `/owner/login` | `/tenant/login` |
| Default landing after login | n/a | `/owner/dashboard` | `/tenant/dashboard` |
| Auth guard | none | `role === "OWNER"` else 403 → `/owner/login` | `role === "TENANT"` else 403 → `/tenant/login` |
| Header / chrome | Public marketing nav | Owner-specific nav (Dashboard, Listings, Profile, Logout) | Tenant-specific nav (Search, Shortlist, Wallet, Profile, Logout) |
| Data they can mutate | none | Their own properties only | Their own shortlist, profile, payments only |
| Data they can read | published listings, content pages | Their listings + analytics on those listings | All published listings + their own private data |

**Role enforcement principles:**

- A tenant attempting to reach `/owner/*` is redirected to `/owner/login` with a notice that an owner account is required. The reverse is true for owners reaching `/tenant/*`.
- Backend authoritatively returns the user's role on login; the web app renders chrome and routes based on that role and never trusts client-side role state alone.
- Legacy unified routes (`/login`, `/register`, `/signup`, `/dashboard`) will redirect to the correct workspace flow based on either an explicit `?role=` parameter or a role-picker page if absent. (Existing `/login`, `/signup`, `/registration` files in the repo are retained as redirector shells.)

---

## 5. Business Use Cases

> Each use case is numbered (UC-XXX) and will be referenced by the task backlog in §8.

### UC-001 — Anonymous tenant searches for a property
**Actor:** Anonymous visitor
**Trigger:** Lands on `/` or `/cities/[city]` and submits the hero search form.
**Preconditions:** None.
**Main flow:**
1. Visitor enters city / locality / move-in date / budget.
2. System calls `GET /api/v1/search` and renders results in `/search`.
3. Visitor refines via filters (`GET /api/v1/filters/metadata`).
4. Visitor opens a result → `/properties/[propertyId]`.

**Postcondition:** Visitor sees property detail with reviews and FAQ.
**Alternate flow:** No results → show empty state with "broaden filters" CTA.

### UC-002 — Tenant registers in the Tenant Workspace
**Actor:** Anonymous visitor
**Trigger:** Clicks "Sign up as a Tenant" anywhere on the public surface, or attempts a gated tenant action.
**Preconditions:** Has valid email.
**Main flow:**
1. Visitor lands on **`/tenant/register`** (the dedicated tenant registration page).
2. Visitor completes email/password form or chooses Google OAuth.
3. Backend validates → creates account with `role = TENANT` → returns auth tokens.
4. User is routed to tenant onboarding and then to **`/tenant/dashboard`**.

**Acceptance:** Account exists with tenant role; auth tokens persisted; tenant chrome rendered; first-name visible in header.
**Alternate flow:** Email already exists with `OWNER` role → block registration with message "This email is already registered as an Owner. Please log in to the Owner Workspace."

### UC-003 — Tenant logs in to the Tenant Workspace
**Actor:** Registered tenant
**Trigger:** Clicks "Login" / "Tenant Login".
**Main flow:** Lands on **`/tenant/login`** → email/password OR Google OAuth → `POST /auth/login` (with role hint = TENANT) or `POST /auth/oauth/google` → backend returns tokens *and* role → if role ≠ TENANT, login is rejected with a redirect suggestion to `/owner/login` → on success, redirect to `/tenant/dashboard`.
**Alternate flow:** Wrong password → inline error; 5 failures → recommend password reset (future).

### UC-004 — Tenant shortlists a property
**Actor:** Authenticated tenant
**Preconditions:** Logged in.
**Main flow:** On `/properties/[propertyId]`, click Shortlist → `POST /api/v1/properties/{id}/save`. Toggle off → `DELETE`.
**Postcondition:** Property visible in tenant dashboard's saved list.

### UC-005 — Tenant contacts owner / submits enquiry
**Actor:** Authenticated tenant (or anonymous via /contact)
**Main flow:** Submits message → `POST /api/v1/support/enquiries` (general) or property-scoped enquiry endpoint (future).

### UC-006 — Tenant pays deposit / rent
**Actor:** Authenticated tenant with an active booking
**Main flow:** Navigates to `/payments` → selects payable item → confirms → payment gateway flow → success state visible in `/wallet`.
**Out-of-scope this phase:** Refund flow, partial payments, EMI.

### UC-007 — Owner registers in the Owner Workspace
**Actor:** Anonymous visitor (intends to list)
**Trigger:** Clicks "List your home" / "Sign up as an Owner" on the public surface.
**Main flow:**
1. Visitor lands on **`/owner/register`** (the dedicated owner registration page).
2. Visitor completes email/password form or chooses Google OAuth.
3. Backend creates account with `role = OWNER` → returns tokens.
4. User is routed to owner onboarding (basic profile, optional KYC stub) → **`/owner/dashboard`**.

**Acceptance:** Owner account exists; owner chrome rendered; "Add Property" CTA visible.
**Alternate flow:** Email already exists with `TENANT` role → block with message and route them to `/tenant/login`.

### UC-008 — Owner logs in to the Owner Workspace
**Actor:** Registered owner
**Main flow:** Lands on **`/owner/login`** → email/password or Google OAuth → backend confirms `role = OWNER` → redirect to `/owner/dashboard`. If role ≠ OWNER, login is rejected with redirect suggestion to `/tenant/login`.

### UC-009 — Owner adds (creates) a new property
**Actor:** Authenticated owner
**Trigger:** Clicks "Add Property" from `/owner/dashboard` or `/owner/listings`.
**Preconditions:** Logged in as owner.
**Main flow:**
1. Owner navigates to **`/owner/listings/new`**.
2. Multi-step form is presented:
   - Step 1 — Basics: title, description, property type, BHK, area, address (with map pin / geocoding)
   - Step 2 — Media: ≥ 3 photos uploaded (with reorder + cover image select)
   - Step 3 — Pricing: monthly rent, security deposit, maintenance, available-from date
   - Step 4 — Amenities & rules: checkboxes for amenities, house rules
   - Step 5 — Review & publish: read-only summary
3. Owner clicks "Publish" → `POST /api/v1/owner/properties` → backend persists → listing becomes status = `PUBLISHED`.
4. Owner is redirected to `/owner/listings` with a success toast and the new property visible at the top.
5. Within ≤ 30s, the same property appears in the Tenant Workspace search index (UC-014).

**Validation:** Photos ≥ 3; rent > 0; available-from ≥ today; address must geocode successfully.
**Alternate flow:** Owner clicks "Save as draft" at any step → property persisted with status = `DRAFT` and is **not** visible to tenants.

### UC-010 — Owner lists / views their properties
**Actor:** Authenticated owner
**Main flow:**
1. Owner navigates to **`/owner/listings`**.
2. Page calls `GET /api/v1/owner/properties` (scoped to current owner only).
3. Page renders a paginated table/grid showing: cover image, title, status (Draft / Published / Paused), price, views, shortlist count, enquiry count, last updated.
4. Each row has actions: **View on tenant site**, **Edit** (UC-011), **Pause / Resume**, **Remove** (UC-012).
**Alternate flow:** Empty state — show "You haven't listed any properties yet" with CTA to UC-009.

### UC-011 — Owner edits an existing property
**Actor:** Authenticated owner
**Preconditions:** Owner is the owner of the property.
**Main flow:**
1. From `/owner/listings`, owner clicks "Edit" on a row → routes to **`/owner/listings/[propertyId]/edit`**.
2. Form is pre-populated via `GET /api/v1/owner/properties/{propertyId}`.
3. Owner edits any field; changes are validated identically to UC-009.
4. On Save → `PUT /api/v1/owner/properties/{propertyId}` → backend updates record.
5. If the property is `PUBLISHED`, the changes propagate to the Tenant Workspace search index within ≤ 30s.
6. Owner sees success toast and is returned to `/owner/listings`.

**Authorisation:** Backend MUST reject any edit attempt where `property.ownerId !== currentUserId` with HTTP 403; the web app surfaces this as "You can only edit your own properties."

### UC-012 — Owner removes (deletes) a property
**Actor:** Authenticated owner
**Preconditions:** Owner is the owner of the property.
**Main flow:**
1. From `/owner/listings`, owner clicks "Remove".
2. Confirmation dialog: "Removing this property will hide it from tenants immediately and cannot be undone after 30 days. Continue?"
3. On confirm → `DELETE /api/v1/owner/properties/{propertyId}` → backend soft-deletes (status = `REMOVED`).
4. The property disappears from `/owner/listings` and from the Tenant Workspace search results within ≤ 30s.
5. Existing tenant shortlists referencing the property show "No longer available".

**Alternate flow:** "Pause" instead of "Remove" — sets status = `PAUSED`; not deleted, just temporarily hidden from tenants. Reversible.

### UC-013 — Owner views dashboard analytics
**Actor:** Authenticated owner
**Main flow:** `/owner/dashboard` shows aggregate KPIs (total listings, total views, total shortlists, total enquiries this month) and a list of the top 3 best-performing listings. Each KPI card links into the corresponding deeper view.

### UC-014 — Tenant discovers an owner-published property
**Actor:** Tenant or anonymous visitor
**Trigger:** A property has just been published in the Owner Workspace (UC-009) or edited (UC-011).
**Main flow:**
1. Within ≤ 30s of `PUBLISHED` status, the property is indexed by the backend search.
2. The property now appears in:
   - Public landing page lists (Trending / New)
   - `/cities/[city]` if the city matches
   - `/search` results matching the filters
   - `/properties/[propertyId]` detail view
3. Authenticated tenants can shortlist (UC-004), enquire (UC-005), and (eventually) pay (UC-006) against this property.
**Postcondition:** A property created by an owner is fully discoverable in the Tenant Workspace without any manual republish step.

> This UC is the cross-workspace contract that satisfies the requirement *"those properties will display into tenant space"*.

### UC-015 — User logs out (workspace-aware)
**Actor:** Any authenticated user
**Main flow:** Owner clicks Logout in owner chrome → `POST /auth/logout` → tokens cleared → redirect to `/owner/login`. Tenant clicks Logout in tenant chrome → redirect to `/tenant/login`.

### UC-016 — Visitor reads content pages
**Actor:** Any
**Main flow:** Pages `/about`, `/how-it-works`, `/privacy-policy`, `/terms-conditions` render content from `GET /api/v1/web-content/{slug}`. Content is editable backend-side without redeploy.

### UC-017 — Token refresh (silent)
**Actor:** System
**Trigger:** 401 from API.
**Main flow:** Interceptor calls `POST /auth/token/refresh` → retries original request. On failure → force logout to the workspace-appropriate login page.

### UC-018 — Cross-workspace access attempt (negative path)
**Actor:** Any authenticated user
**Trigger:** A logged-in tenant tries to open `/owner/...` (or vice versa).
**Main flow:** Route guard detects role mismatch → redirects to the correct workspace dashboard with a toast: *"This area is only available to owners. You're signed in as a tenant."*
**Postcondition:** No data leakage between workspaces.

---

## 6. Functional Requirements (FR)

| ID | Requirement | Linked UC |
|----|-------------|-----------|
| FR-01 | The system shall present a search form on the landing page accepting city, locality, move-in date, and budget range. | UC-001 |
| FR-02 | The system shall display a list of trending and new listings on the landing page from `GET /api/v1/listings/trending` and `/new`. | UC-001 |
| FR-03 | The system shall render city landing pages at `/cities/[city]` with city-scoped listings. | UC-001 |
| FR-04 | The system shall render a property detail page including images, price, amenities, reviews, and FAQ. | UC-001 |
| FR-05 | The system shall provide a **dedicated tenant registration page** at `/tenant/register` accepting email/password or Google OAuth. | UC-002 |
| FR-06 | The system shall provide a **dedicated tenant login page** at `/tenant/login` and route on success to `/tenant/dashboard`. | UC-003 |
| FR-07 | The system shall enforce role-based authentication: any access to `/tenant/*` requires `role = TENANT`; any access to `/owner/*` requires `role = OWNER`. | UC-018 |
| FR-08 | The system shall allow an authenticated tenant to save/un-save a property. | UC-004 |
| FR-09 | The system shall allow an authenticated tenant to view saved properties in the tenant dashboard. | UC-004 |
| FR-10 | The system shall accept support enquiries via `/contact` and POST them to the backend. | UC-005 |
| FR-11 | The system shall present a payments page listing payable items and a payment confirmation flow. | UC-006 |
| FR-12 | The system shall present a wallet view showing balance, transactions, and pending items. | UC-006 |
| FR-13 | The system shall provide a **dedicated owner registration page** at `/owner/register`. | UC-007 |
| FR-14 | The system shall provide a **dedicated owner login page** at `/owner/login` and route on success to `/owner/dashboard`. | UC-008 |
| FR-15 | The system shall let an owner **add (create)** a property through a multi-step guided form at `/owner/listings/new`. | UC-009 |
| FR-16 | The system shall let an owner **list (view)** all of their own properties at `/owner/listings`, scoped to the owner's user ID. | UC-010 |
| FR-17 | The system shall let an owner **edit** their own property at `/owner/listings/[propertyId]/edit` and reject edits to properties they do not own (403). | UC-011 |
| FR-18 | The system shall let an owner **remove** their own property via a confirmation dialog (soft delete). | UC-012 |
| FR-19 | The system shall let an owner **pause / resume** a property without deleting it. | UC-012 |
| FR-20 | The system shall surface owner-published properties in the Tenant Workspace search and discovery surfaces within 30 seconds of publish/edit. | UC-014 |
| FR-21 | The system shall hide `DRAFT`, `PAUSED`, and `REMOVED` properties from the Tenant Workspace at all times. | UC-009, UC-012 |
| FR-22 | The system shall present **role-aware site chrome** (header + sidebar + nav) — owner chrome inside `/owner/*`, tenant chrome inside `/tenant/*`. | UC-002, UC-007 |
| FR-23 | The system shall log the user out and clear tokens, redirecting to the workspace-appropriate login page. | UC-015 |
| FR-24 | The system shall fetch content for static pages from the `web-content` API. | UC-016 |
| FR-25 | The system shall transparently refresh expired access tokens. | UC-017 |
| FR-26 | The system shall block registering the same email under both roles; one email = one role at a time. | UC-002, UC-007 |
| FR-27 | The system shall redirect cross-workspace access attempts back to the user's correct workspace with a notification. | UC-018 |
| FR-28 | The system shall display validation errors inline (React Hook Form + Zod). | All forms |
| FR-29 | The system shall be responsive across mobile (≥360px), tablet, and desktop breakpoints. | All |
| FR-30 | The system shall display KPIs (views, shortlists, enquiries, active listings) on `/owner/dashboard`. | UC-013 |

---

## 7. Non-Functional Requirements (NFR)

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | LCP < 2.5s on 4G, search results render < 1s after API response |
| NFR-02 | Accessibility | WCAG 2.1 AA — keyboard nav, ARIA, alt text, color contrast ≥ 4.5:1 |
| NFR-03 | Security | Tokens stored via HttpOnly cookie or secure storage; no PII in logs; CSP headers |
| NFR-04 | Browser support | Latest 2 versions of Chrome, Safari, Edge, Firefox |
| NFR-05 | i18n | Copy externalized for future locale support (English-only at MVP) |
| NFR-06 | Observability | Client error reporting hook (Sentry-compatible) |
| NFR-07 | SEO | Server-rendered metadata for `/`, `/cities/*`, `/properties/*` |
| NFR-08 | Resilience | Graceful fallback to cached/stub data when backend is unreachable (already partially in `lib/api/fallback-data.ts`) |
| NFR-09 | Privacy | Cookie consent banner; explicit Google OAuth scope disclosure |
| NFR-10 | Maintainability | Strict TypeScript; ESLint + Prettier pass on CI; ≥ 60% unit-test coverage on `lib/` |

---

## 8. Task Backlog (Epics → Stories) — for engineering once approved

> Format: **[Priority] EPIC-N / STORY-N — title (linked UC, est. effort in story points)**
> Priority: P0 = MVP-blocking, P1 = MVP-important, P2 = post-MVP.

### EPIC-1 — Discovery & Search (P0)
- [P0] STORY-1.1 — Build hero search form on `/` with city/date/budget inputs (UC-001, 3 pts)
- [P0] STORY-1.2 — Wire `/search` results page to `GET /api/v1/search` with pagination (UC-001, 5 pts)
- [P0] STORY-1.3 — Build filter sidebar from `GET /api/v1/filters/metadata` (UC-001, 5 pts)
- [P1] STORY-1.4 — Map view backed by `POST /api/v1/search/map` (UC-001, 8 pts)
- [P0] STORY-1.5 — `/cities/[city]` SEO-friendly landing page (UC-001, 3 pts)
- [P0] STORY-1.6 — `/properties/[propertyId]` detail page with reviews + FAQ (UC-001, 8 pts)

### EPIC-2 — Account & Auth (P0)
> Two parallel auth surfaces, one per workspace. Shared underlying token logic.

- [P0] STORY-2.1 — Build **`/tenant/register`** page with email/password form + Zod validation (UC-002, 3 pts)
- [P0] STORY-2.2 — Build **`/tenant/login`** page with email/password form + error states (UC-003, 2 pts)
- [P0] STORY-2.3 — Build **`/owner/register`** page with email/password form + Zod validation (UC-007, 3 pts)
- [P0] STORY-2.4 — Build **`/owner/login`** page with email/password form + error states (UC-008, 2 pts)
- [P0] STORY-2.5 — Google OAuth on all four auth pages, with role hint passed to backend (UC-002, UC-003, UC-007, UC-008, 5 pts)
- [P0] STORY-2.6 — Token storage + axios interceptor with silent refresh (UC-017, 5 pts)
- [P0] STORY-2.7 — Workspace-aware logout that lands on the correct login page (UC-015, 2 pts)
- [P0] STORY-2.8 — **Role-based route guard** (Next.js middleware): blocks `/tenant/*` for non-tenants, `/owner/*` for non-owners, redirects per FR-07 / FR-27 (UC-018, 5 pts)
- [P0] STORY-2.9 — Block dual-role registration with same email; show friendly cross-workspace redirect message (FR-26, 2 pts)
- [P1] STORY-2.10 — Legacy redirector shells: `/login`, `/register`, `/signup` route to a role-picker page (2 pts)
- [P1] STORY-2.11 — Tenant onboarding (profile basics) (UC-002, 2 pts)
- [P1] STORY-2.12 — Owner onboarding (profile basics + KYC stub) (UC-007, 3 pts)
- [P2] STORY-2.13 — Forgot password flows for both workspaces (deferred)

### EPIC-3 — Tenant Workspace (P0)
> Lives entirely under `/tenant/*`. Discovery surfaces are reused from public routes.

- [P0] STORY-3.1 — Tenant chrome (header, sidebar, role-aware nav) (FR-22, 3 pts)
- [P0] STORY-3.2 — `/tenant/dashboard` with shortlist tab, recent searches, payment history snapshot (UC-004, 5 pts)
- [P0] STORY-3.3 — Shortlist toggle on listing card + detail page (UC-004, 3 pts)
- [P1] STORY-3.4 — `/tenant/profile` profile / settings (3 pts)
- [P1] STORY-3.5 — Enquiries history view (UC-005, 3 pts)
- [P1] STORY-3.6 — Tenant view consumes the cross-workspace visibility contract (UC-014) — verify newly-published owner properties appear within 30s (3 pts)

### EPIC-4 — Payments & Wallet (P1)
- [P1] STORY-4.1 — `/payments` payable list + confirm flow (UC-006, 8 pts)
- [P1] STORY-4.2 — Payment gateway integration (Razorpay/Stripe — TBD) (UC-006, 8 pts)
- [P1] STORY-4.3 — `/wallet` balance + transaction history (UC-006, 5 pts)
- [P2] STORY-4.4 — Auto-pay setup (deferred)

### EPIC-5 — Owner Workspace + Property CRUD (P0)
> Lives entirely under `/owner/*`. Full CRUD on properties owned by the current user.

- [P0] STORY-5.1 — `/list-your-home` public marketing page that links into `/owner/register` (UC-007, 2 pts)
- [P0] STORY-5.2 — Owner chrome (header, sidebar, role-aware nav) (FR-22, 3 pts)
- [P0] STORY-5.3 — `/owner/dashboard` with KPI cards (views, shortlists, enquiries, active listings) + top 3 listings (UC-013, 5 pts)
- [P0] STORY-5.4 — **Add property:** multi-step form at `/owner/listings/new` (basics → media → pricing → amenities → review) wired to `POST /api/v1/owner/properties` (UC-009, 13 pts)
- [P0] STORY-5.5 — **List properties:** `/owner/listings` table view, scoped to current owner via `GET /api/v1/owner/properties`, with status badges and per-row actions (UC-010, 5 pts)
- [P0] STORY-5.6 — **Edit property:** `/owner/listings/[propertyId]/edit` form pre-populated via `GET /api/v1/owner/properties/{id}` and saved via `PUT /api/v1/owner/properties/{id}`, with 403 handling (UC-011, 8 pts)
- [P0] STORY-5.7 — **Remove property:** confirm-dialog soft delete via `DELETE /api/v1/owner/properties/{id}` (UC-012, 3 pts)
- [P0] STORY-5.8 — **Pause / Resume property:** toggle status without deletion (UC-012, 3 pts)
- [P0] STORY-5.9 — **Cross-workspace visibility verification:** integration test that proves a newly-published owner property appears in tenant search within 30s (UC-014, FR-20, 3 pts)
- [P0] STORY-5.10 — **Status filtering** in tenant-facing search to exclude DRAFT/PAUSED/REMOVED (FR-21, 2 pts; backend-side, UI verifies)
- [P1] STORY-5.11 — Draft autosave on add/edit form (3 pts)
- [P1] STORY-5.12 — Photo upload widget with reorder + cover-image selection (5 pts)
- [P2] STORY-5.13 — KYC document upload UI (deferred to Phase 2)

### EPIC-6 — Content & Support (P0)
- [P0] STORY-6.1 — Render `/about`, `/how-it-works`, `/privacy-policy`, `/terms-conditions` from `web-content` API (UC-016, 3 pts)
- [P0] STORY-6.2 — `/contact` form posting to `/api/v1/support/enquiries` (UC-005, 2 pts)

### EPIC-7 — Cross-cutting (P0)
- [P0] STORY-7.1 — Public marketing chrome (header + footer for `/`, content pages) (3 pts)
- [P0] STORY-7.2 — Responsive layout audit across all three chromes (public / owner / tenant) (3 pts)
- [P0] STORY-7.3 — Error boundaries + toast system (3 pts)
- [P0] STORY-7.4 — Cross-workspace deep-link handling: hitting `/tenant/x` while logged in as owner shows the toast and redirect from UC-018 (FR-27, 2 pts)
- [P1] STORY-7.5 — Sentry / error reporting hook (NFR-06, 2 pts)
- [P1] STORY-7.6 — SEO metadata + Open Graph for key routes (NFR-07, 3 pts)
- [P1] STORY-7.7 — Cookie consent banner (NFR-09, 2 pts)
- [P1] STORY-7.8 — Accessibility audit + fixes (NFR-02, 5 pts)

### EPIC-8 — Quality & Release (P1)
- [P1] STORY-8.1 — Unit tests for `lib/` and `store/` (NFR-10, 5 pts)
- [P1] STORY-8.2 — Playwright E2E for the 7 critical flows: tenant register → login → search → save; owner register → login → add property → verify property appears in tenant search; owner edit; owner remove; cross-workspace deep-link redirect; payment confirm (10 pts)
- [P1] STORY-8.3 — CI pipeline (lint + type-check + test + build) (3 pts)

**MVP totals (P0 only):** ~30 P0 stories across EPIC-1/2/3/5/6/7 ≈ **~135 story points** (uplift vs v0.1 driven by separate auth pages per workspace and explicit owner CRUD).

---

## 9. Acceptance Criteria for MVP Release

The MVP is releasable when **all** of the following are true:

1. All P0 stories are demonstrably complete with acceptance tests passing.
2. A tenant can: register at `/tenant/register` → log in at `/tenant/login` → search → open a listing → shortlist → log out → log back in → see their shortlist.
3. An owner can: register at `/owner/register` → log in at `/owner/login` → **add** a property → see it in `/owner/listings` → **edit** it → see updates in tenant search → **pause** it → see it disappear from tenant search → **resume** it → **remove** it.
4. Cross-workspace contract: a property added by an owner appears in tenant search within 30 seconds of publish; a removed/paused property disappears within 30 seconds.
5. Cross-workspace isolation: a logged-in tenant cannot reach `/owner/*` and vice versa.
6. The same email cannot register as both Owner and Tenant.
7. Content pages load from the backend `web-content` API with no hardcoded copy.
8. NFR-01, NFR-02 (AA), NFR-04, NFR-07 are verified by audit.
9. Error reporting (NFR-06) is wired in production builds.
10. Privacy & Terms pages reflect Legal-approved copy.

---

## 10. Assumptions

- Backend (`housing-owner-tenant-backend-api`) is the source of truth for data and authentication; the web app does not own user state.
- Google OAuth web client and authorized origins/redirects are configured per the README.
- Payment gateway choice (Razorpay vs Stripe vs other) will be confirmed before EPIC-4 work begins.
- Single locale (English) at MVP.
- Geographic scope confirmed before EPIC-4 (impacts currency, regulation, tax).

---

## 11. Dependencies

| Dependency | Owner | Required by |
|------------|-------|-------------|
| Backend endpoints listed in README | Backend team | All EPICs |
| Google OAuth client + redirect URIs | DevOps / Product Owner | EPIC-2 |
| Payment gateway account & keys | Finance / DevOps | EPIC-4 |
| Final copy for Privacy / Terms | Legal | EPIC-6 |
| Brand assets, color tokens, logo | Design | EPIC-7 |
| Sentry (or alternative) project | DevOps | STORY-7.5 |

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Backend API contract drift | Med | High | Lock OpenAPI; version pin; contract tests |
| OAuth misconfiguration in prod | Med | High | Pre-prod parity check; staging origin matches prod |
| Payment regulation (PCI/RBI) gaps | Low | Critical | Use hosted gateway widget; never touch raw card data |
| Scope creep into messaging / e-sign | High | Med | Maintain explicit out-of-scope list (§4.2); change-control via this BRD |
| Performance regressions from heavy property pages | Med | Med | Image CDN + lazy load; Lighthouse CI gate |

---

## 13. Open Questions for Product Owner

> ⚠ Please answer these before EPIC-1 starts. Mark inline with your decisions and I'll fold them in.

1. **Geography & currency at MVP?** (e.g., India only / INR; UK only / GBP; US only / USD)
2. **Payment provider preference?** (Razorpay / Stripe / both)
3. **Is Google OAuth mandatory or one of multiple providers?** (Apple? Facebook? Email-link only?)
4. **Owner KYC at MVP — display only, or do we block listing publish until KYC review?**
5. **Reviews — who can post? Any tenant who has paid? Any registered tenant? Moderation flow?**
6. **Pricing model — listing fee, success fee, subscription?** (impacts owner dashboard UI)
7. **Lease document handling — out of scope this phase, but where do we surface "download lease"?**
8. **Map provider** — Google Maps / Mapbox / Leaflet+OSM? (impacts STORY-1.4 + cost)
9. **Brand & visual system** — do we have Figma / design tokens to align with, or are we using the current Tailwind defaults?
10. **Analytics** — GA4? Mixpanel? Self-hosted? (impacts NFR-06 & STORY-7.4 scope)

---

## 14. Change Log

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 0.1 | 2026-04-30 | BA (Claude) | Initial draft based on existing repo structure. Awaiting review. |
| 0.2 | 2026-04-30 | BA (Claude) | Per stakeholder direction: introduced strict two-workspace architecture (Owner Workspace + Tenant Workspace). Each workspace has its own dedicated registration and login pages. Expanded owner experience into explicit Add / List / Edit / Remove use cases (UC-009 → UC-012) and added cross-workspace visibility contract (UC-014) plus cross-workspace isolation (UC-018). Updated FRs (FR-05 … FR-30), task backlog (EPIC-2 expanded to 13 stories, EPIC-5 expanded to 13 stories), MVP acceptance criteria, and §4.3 Workspace Architecture. |

---

## 15. Approval

| Role | Name | Decision | Date |
|------|------|----------|------|
| Product Owner | _____ | ☐ Approve ☐ Approve w/ changes ☐ Reject | |
| Engineering Lead | _____ | ☐ Approve ☐ Approve w/ changes ☐ Reject | |
| Design Lead | _____ | ☐ Approve ☐ Approve w/ changes ☐ Reject | |

> **Once this BRD is approved, the engineering team will translate the §8 backlog into Jira/GitHub issues and begin coding sprint-by-sprint.** Until then, no further code changes will be made.
