/**
 * Custom test fixture — extends Playwright's base test with:
 *   - apiClient   : a logged-in API request context (per role)
 *   - testData    : a fresh set of unique test-data values per test
 *   - dbHelper    : helpers for direct DB seeding / cleanup
 *
 * Usage:
 *   import { test, expect } from "@fixtures/test.fixture";
 *
 *   test("tenant can save a search", async ({ page, apiClient, testData }) => {
 *     ...
 *   });
 */
import { test as base, expect, type APIRequestContext } from "@playwright/test";
import { ApiClient } from "../api/client";
import { randomString, randomEmail } from "../helpers/random";

type TestFixtures = {
  apiClient: ApiClient;
  testData: {
    runId: string;
    email: string;
    listingTitle: string;
    cityName: string;
  };
};

export const test = base.extend<TestFixtures>({
  apiClient: async ({ request, baseURL }, use) => {
    const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";
    const client = new ApiClient(request, apiBase);
    await use(client);
  },

  testData: async ({}, use) => {
    const runId = randomString(8);
    await use({
      runId,
      email: randomEmail(runId),
      listingTitle: `[QA-${runId}] Test Listing`,
      cityName: "Bengaluru"
    });
  }
});

export { expect };
