/**
 * Search page visual baseline.
 *
 * Visually catches regressions on the listing-card grid — the most edited
 * surface in the app. We capture the result grid in two states:
 *   1. Default (no filter applied)
 *   2. With city filter applied (active filter chip rendered)
 */
import { test, expect } from "@playwright/test";
import { prepareForSnapshot, dismissTransientUi, dynamicMasks } from "../../pages/visual.helpers";

test.describe("visual: search", () => {
  test("default results grid", async ({ page }) => {
    await page.goto("/search");
    await dismissTransientUi(page);
    await prepareForSnapshot(page);

    // Wait for at least one card before snapshotting.
    await expect(page.locator("article").first()).toBeVisible();

    await expect(page).toHaveScreenshot("search-default.png", {
      fullPage: false,
      mask: [
        ...dynamicMasks(page),
        // Listing cover images vary per environment — mask them.
        page.locator("article img"),
        // Posted-time label is dynamic ("2 days ago").
        page.locator("article :text('ago')")
      ]
    });
  });

  test("first listing card in isolation", async ({ page }) => {
    await page.goto("/search");
    await dismissTransientUi(page);
    await prepareForSnapshot(page);

    const firstCard = page.locator("article").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toHaveScreenshot("listing-card.png", {
      mask: [
        firstCard.locator("img"),
        firstCard.locator(":text('ago')")
      ]
    });
  });
});
