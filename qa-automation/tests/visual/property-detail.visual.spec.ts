/**
 * Property detail page — visual baseline.
 *
 * Many sub-regions vary per listing (title, photos, rent), so we capture
 * the page chrome with heavy masking on data-bearing regions. The point
 * is to catch layout regressions, not detect content changes.
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../../api/client";
import { PropertiesApi } from "../../api/properties.api";
import { prepareForSnapshot, dismissTransientUi, dynamicMasks } from "../../pages/visual.helpers";

test("visual: property detail page (data masked)", async ({ page, request }) => {
  // Use the API to find the first published listing — we don't care which
  // one, only that the page renders. Mask the listing-specific content.
  const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";
  const client = new ApiClient(request, apiBase);
  const search = await PropertiesApi.search(client, { city: "Bengaluru" });
  test.skip(!search.results.length, "No seeded listings — cannot snapshot.");

  await page.goto(`/properties/${search.results[0]!.listingId}`);
  await dismissTransientUi(page);

  // Wait for hero region.
  await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 15_000 });
  await prepareForSnapshot(page);

  await expect(page).toHaveScreenshot("property-detail.png", {
    fullPage: false,
    mask: [
      ...dynamicMasks(page),
      // Listing title — varies per row
      page.locator("h1, h2").first(),
      // Photos
      page.locator("img").filter({ hasNot: page.locator("[aria-label='logo']") }),
      // Rent + locality lines
      page.locator(":text('₹')"),
      // Owner card on the right
      page.locator("[data-testid='owner-card']")
    ],
    maxDiffPixelRatio: 0.025 // slightly looser — heavy masking + tall page
  });
});
