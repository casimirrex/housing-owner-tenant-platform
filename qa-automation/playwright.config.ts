/**
 * Playwright config — enterprise layout.
 *
 *  Projects (each one is an independent test segment):
 *    smoke         — minimal critical-path tests, run on EVERY deploy
 *    api           — API contract tests against the Spring Boot backend
 *    chromium-e2e  — full UI regression on Chromium
 *    firefox-e2e   — same UI regression on Firefox (cross-browser parity)
 *    webkit-e2e    — Safari/iOS parity (run nightly only)
 *    a11y          — axe-based WCAG 2.1 AA audit
 *    visual        — visual regression snapshots
 *
 *  Each role's auth state is captured ONCE via fixtures/auth.setup.ts
 *  and reused across every test. ~10x faster than logging in per-test.
 *
 *  Tracing / video / screenshot policy:
 *    - "on-first-retry" — kept off the happy path (cheap CI), captured on flake.
 *    - PR/CI runs: retries=2 → flaky tests get one extra chance + a trace.
 */
import { defineConfig, devices } from "@playwright/test";
import * as path from "path";
import * as dotenv from "dotenv";

// Load env file based on TEST_ENV (defaults to .env.local)
const envName = process.env.TEST_ENV ?? "local";
dotenv.config({ path: path.resolve(__dirname, `.env.${envName}`) });

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  // Reporters — HTML for humans, JUnit for CI dashboards, Allure for trends.
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["allure-playwright", { outputFolder: "allure-results" }]
  ],

  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      "x-test-run": "qa-automation"
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000
  },

  // Global expect timeout — generous for slow CI hosts.
  expect: { timeout: 10_000 },

  projects: [
    // ── Setup project: logs in each role once and saves storage state. ──
    {
      name: "auth-setup",
      testMatch: /.*auth\.setup\.ts/
    },

    // ── Smoke: minimal critical paths against any env (incl. prod). ──
    {
      name: "smoke",
      testMatch: /.*\/smoke\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] }
    },

    // ── API contract tests: no browser, just the request fixture. ──
    {
      name: "api",
      testMatch: /tests\/api\/.*\.spec\.ts/,
      use: {
        baseURL: API_BASE_URL,
        // No browser launched — purely HTTP via request fixture.
      }
    },

    // ── Full E2E suites on each browser. ──
    {
      name: "chromium-e2e",
      use: {
        ...devices["Desktop Chrome"],
        storageState: undefined // overridden by fixture per-role
      },
      dependencies: ["auth-setup"],
      testMatch: /tests\/e2e\/.*\.spec\.ts/,
      testIgnore: /tests\/e2e\/smoke\/.*/
    },
    {
      name: "firefox-e2e",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["auth-setup"],
      testMatch: /tests\/e2e\/.*\.spec\.ts/,
      testIgnore: /tests\/e2e\/smoke\/.*/
    },
    {
      name: "webkit-e2e",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["auth-setup"],
      testMatch: /tests\/e2e\/.*\.spec\.ts/,
      testIgnore: /tests\/e2e\/smoke\/.*/
    },

    // ── Accessibility audits. ──
    {
      name: "a11y",
      testMatch: /tests\/a11y\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] }
    },

    // ── Mobile viewport sanity (re-runs the smoke suite). ──
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
      testMatch: /.*\/smoke\/.*\.spec\.ts/
    }
  ],

  outputDir: "test-results/"
});
