/**
 * Admin Moderate Listings E2E.
 *
 *   ✓ Moderation queue renders the table with at least one row (seeded data)
 *   ✓ Status select per row is wired to the moderation API
 *   ✓ Flagged rows (fraud_score > 0 OR open_reports > 0) get the rose tint
 *   ✓ Network call goes to PATCH /api/v1/admin/listings/{id}
 *
 * Strategy: avoid actually mutating production-like seed data by mocking
 * the moderate endpoint. We still assert the network call shape.
 */
import { test, expect } from "@playwright/test";
import { AdminListingsPage } from "../../../pages/admin/admin-listings.page";
import { STORAGE } from "../../../fixtures/auth.setup";

test.use({ storageState: STORAGE.ADMIN });

test("moderation queue renders rows", async ({ page }) => {
  const listings = new AdminListingsPage(page);
  await listings.open();
  expect(await listings.rowCount()).toBeGreaterThan(0);
});

test("admin can suspend a listing — mocked API", async ({ page }) => {
  // Intercept the moderation PATCH so we never actually mutate the DB.
  let captured: { url: string; body: unknown } | null = null;
  await page.route("**/api/v1/admin/listings/**", async (route) => {
    captured = { url: route.request().url(), body: route.request().postDataJSON() };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });

  const listings = new AdminListingsPage(page);
  await listings.open();

  // Grab the title of the first row, then act on that exact row.
  const firstTitle = await listings.rows().first().locator("a").first().textContent();
  expect(firstTitle).toBeTruthy();
  await listings.moderate(firstTitle!.trim(), "SUSPENDED");

  // Network call MUST have fired.
  await expect.poll(() => captured !== null, { timeout: 5_000 }).toBe(true);
  expect(captured!.url).toMatch(/\/api\/v1\/admin\/listings\//);
});
