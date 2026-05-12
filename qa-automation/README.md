# Testition QA Automation — Test Architect Reference

Enterprise-grade test automation framework for the Testition (Rent Beyond) rental platform.

## Stack

| Concern | Tool | Why |
|---|---|---|
| Test runner | **Playwright** 1.49+ | Auto-wait, parallel by default, trace viewer, network mocking, first-class CI image |
| Language | **TypeScript** | Same as frontend → zero new lang for devs to contribute |
| API tests | Playwright `request` fixture | One framework, two test types — no second toolchain to maintain |
| Accessibility | `@axe-core/playwright` | WCAG 2.1 AA conformance — DPDP-adjacent compliance |
| Reporting | Allure + HTML + JUnit XML | Allure for trends, HTML for human triage, JUnit for CI dashboards |
| CI | GitHub Actions | Existing CI surface; matrix builds for browsers |

## Layered architecture

```
qa-automation/
├── fixtures/              # Reusable test setup (auth, custom test obj)
│   ├── auth.setup.ts      # Logs in each role once, saves storageState
│   └── test.fixture.ts    # Extends Playwright test with apiClient + testData
│
├── pages/                 # Page Object Model — one file per screen
│   ├── base.page.ts       # All POMs extend this
│   ├── login.page.ts
│   ├── admin/             # Admin-side screens
│   ├── owner/             # Owner-side screens
│   └── tenant/            # Tenant-side screens
│
├── api/                   # API client + typed endpoint wrappers
│   ├── client.ts          # HTTP wrapper around Playwright request
│   ├── auth.api.ts
│   └── properties.api.ts
│
├── tests/
│   ├── e2e/
│   │   ├── smoke/         # ~5 tests, must pass on every deploy
│   │   ├── tenant/        # Tenant journeys
│   │   ├── owner/         # Owner journeys
│   │   ├── admin/         # Admin console regression
│   │   └── i18n/          # Translation regression (Hi/Kn/Ta)
│   ├── api/               # API contract tests
│   └── a11y/              # WCAG audits
│
├── helpers/               # Pure utilities (random data, DB access)
├── .github/workflows/     # CI definition
├── playwright.config.ts   # All Playwright config (projects, reporters, retry)
├── tsconfig.json
└── package.json
```

## Quick start

```bash
# 1. Install deps + browsers (one-time)
cd qa-automation
cp .env.example .env.local
npm ci
npx playwright install --with-deps chromium

# 2. Boot the app — backend on :8080, frontend on :3000
#    (See repo root README for docker-compose instructions)

# 3. Run the suite
npm run test:smoke         # ~30s — critical path only
npm run test:api           # ~2min — API contract
npm run test:e2e           # ~12min — full Chromium E2E
npm run test:a11y          # ~2min — WCAG 2.1 AA audit
npm run test:i18n          # ~3min — Tamil/Hindi/Kannada coverage
npm test                   # everything (use --project= to filter)
```

## Test pyramid

```
              ┌──────────────┐
              │ E2E (visual) │  ← 5-10 tests, nightly
              ├──────────────┤
              │ E2E (UI)     │  ← 80-150 tests, nightly + on PR
              ├──────────────┤
              │ API contract │  ← 60-120 tests, on PR
              ├──────────────┤
              │ Integration  │  ← Spring Boot + Testcontainers (backend/src/test)
              ├──────────────┤
              │   Unit       │  ← JUnit5 (backend) + Vitest (frontend, future)
              └──────────────┘
```

Goal ratios: **~70% unit / ~20% integration+API / ~10% E2E**. This repo focuses on the top three; the bottom two live with the source code.

## Roles & test data

Seeded by `backend/src/main/resources/data.sql`. Available out of the box:

| Role | Email | Password |
|---|---|---|
| TENANT | `aarav@example.com` | `StrongPassword@123` |
| OWNER | `rohit.mehta@example.com` | `StrongPassword@123` |
| ADMIN | `aarav@example.com` (auto-promoted by data.sql) | `StrongPassword@123` |

The auth setup project logs in each role **once** at the start of every CI run and saves the storageState to `playwright/.auth/<role>.json`. Every E2E test then opts into a role with:

```ts
test.use({ storageState: STORAGE.ADMIN });
```

This eliminates ~95% of redundant login work — a 12-min suite becomes a 3-min suite.

## Multi-environment

Pick the target env at run time:

```bash
TEST_ENV=local      npm test    # default → .env.local
TEST_ENV=staging    npm test    # .env.staging — points at staging.testition.tech
TEST_ENV=production npm run test:smoke    # ONLY smokes against prod, never destructive
```

Production runs are **smoke-only** and **read-only** by convention — they never POST, never modify DB state.

## Reporting

Three reporters fire on every run:

| Reporter | Output | Audience |
|---|---|---|
| `list` | stdout | Local dev / CI logs |
| `html` | `playwright-report/` | Triage failures, view traces |
| `junit` | `test-results/junit.xml` | GitHub Actions test summary |
| `allure` | `allure-results/` | Long-term trend tracking |

Open the HTML report after a run:

```bash
npm run report
```

Replay a flaky test's trace:

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

## Test taxonomy & tags

Tag tests with `@smoke`, `@regression`, `@admin`, `@i18n`, `@a11y`. Filter:

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@admin"
```

## CI tiers (defined in `.github/workflows/qa.yml`)

| Tier | When | What runs | Time budget |
|---|---|---|---|
| **1. PR fast feedback** | Every PR | Smoke + API contract | <5 min |
| **2. Nightly regression** | Cron 02:30 IST | Full E2E across Chromium/Firefox/WebKit | <45 min |
| **3. A11y audit** | Cron nightly | axe-core WCAG 2.1 AA | <15 min |
| **4. Deploy smoke** | After every prod deploy | Smoke only against prod | <2 min |

## What's NOT in this framework (yet)

- **Visual regression** — recommend Playwright's `toHaveScreenshot()` for stable pages. Not enabled by default because the UI is still evolving.
- **Performance** — recommend [k6](https://k6.io) running in a separate workflow. Targets: `/search` p95 < 500ms, `/auth/login` p95 < 300ms.
- **Security** — recommend OWASP ZAP baseline scan as a weekly workflow.
- **Mobile native** — out of scope; the app is responsive web only.

These are intentional gaps — add them when the matching risk justifies the cost.

## Extending — adding a new test

1. Find the right folder (`tests/e2e/<persona>/` for UI, `tests/api/` for API).
2. Pick the right storageState (`STORAGE.ADMIN` / `STORAGE.OWNER` / `STORAGE.TENANT`).
3. Write the test using Playwright's `getByRole` / `getByLabel` (avoid CSS selectors).
4. If a new screen is involved, add a Page Object under `pages/`.
5. Run locally: `npx playwright test --headed your-new.spec.ts`.

## Anti-patterns to avoid

- ❌ Sleeping `await page.waitForTimeout(N)` — use `await expect(locator).toBeVisible()` instead. Playwright auto-waits.
- ❌ CSS selectors like `.btn.btn-primary` — fragile. Use `getByRole`, `getByLabel`, `getByText`.
- ❌ Sharing state between tests — every test should be runnable in isolation.
- ❌ Re-logging-in per test — use `storageState`.
- ❌ Asserting on volatile content (timestamps, IDs) — use stable test data or mock.
- ❌ `console.log` debugging — use `--debug` or `--ui` mode instead.

## Decision log

**Why Playwright over Selenium/Cypress?**
- Selenium: slower, no first-class network mocking, more flake.
- Cypress: same-origin restrictions, no multi-tab, no multi-context, slower in CI.
- Playwright: every gap above is fixed. Same auth flow that broke this project's admin-access regression today is now codified in `tests/e2e/admin/admin-access.spec.ts`.

**Why TypeScript over Java (RestAssured)?**
- The frontend is already TypeScript. Devs contribute test fixes without learning a new lang.
- One language across UI + API tests = one CI runtime, one set of build artifacts.
- Backend's existing JUnit tests stay where they are — they cover service/repo layers, which this suite doesn't.

**Why Page Object Model?**
- Selector changes happen 10x more often than test changes. POM isolates them.
- New tests reuse existing page methods → no copy-paste drift.

---

Maintained by the QA Engineering team. PRs welcome. Failing tests on `main` block deploys.
