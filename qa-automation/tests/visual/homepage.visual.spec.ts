/**
 * Homepage visual baseline.
 *
 * Captures three states: above-the-fold hero, full-page scroll, and the
 * footer in isolation. Three separate snapshots so a single small change
 * (e.g. footer link) doesn't fail the hero snapshot too.
 */
import { test, expect } from "@playwright/test";
import { prepareForSnapshot, dismissTransientUi, dynamicMasks } from "../../pages/visual.helpers";

test.describe("visual: homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await dismissTransientUi(page);
    await prepareForSnapshot(page);
  });

  test("hero (above the fold)", async ({ page }) => {
    await expect(page).toHaveScreenshot("homepage-hero.png", {
      fullPage: false,
      mask: dynamicMasks(page)
    });
  });

  test("full page scroll", async ({ page }) => {
    await expect(page).toHaveScreenshot("homepage-full.png", {
      fullPage: true,
      mask: dynamicMasks(page),
      maxDiffPixelRatio: 0.015 // slightly looser — longer page = more variance
    });
  });

  test("footer in isolation", async ({ page }) => {
    const footer = page.locator("footer").first();
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toHaveScreenshot("homepage-footer.png", {
      mask: dynamicMasks(page)
    });
  });
});
