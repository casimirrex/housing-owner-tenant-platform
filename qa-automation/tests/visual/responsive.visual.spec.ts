/**
 * Responsive visual regression — same page at 3 viewports.
 *
 * Mobile, tablet, desktop. We test the homepage and search page since
 * those are responsibility-critical (most landing traffic + most-used
 * feature).
 *
 * Why per-viewport snapshots: a single CSS breakpoint change can pass
 * desktop and fail mobile. One snapshot per viewport catches it cheaply.
 */
import { test, expect } from "@playwright/test";
import { prepareForSnapshot, dismissTransientUi, dynamicMasks } from "../../pages/visual.helpers";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },   // iPhone 13/14
  { name: "tablet", width: 820, height: 1180 },  // iPad mini portrait
  { name: "desktop", width: 1440, height: 900 }
];

for (const viewport of VIEWPORTS) {
  test.describe(`visual: ${viewport.name} (${viewport.width}×${viewport.height})`, () => {
    test.use({ viewport });

    test(`homepage @ ${viewport.name}`, async ({ page }) => {
      await page.goto("/");
      await dismissTransientUi(page);
      await prepareForSnapshot(page);
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        fullPage: false,
        mask: dynamicMasks(page)
      });
    });

    test(`search @ ${viewport.name}`, async ({ page }) => {
      await page.goto("/search");
      await dismissTransientUi(page);
      await prepareForSnapshot(page);
      await expect(page.locator("article").first()).toBeVisible();
      await expect(page).toHaveScreenshot(`search-${viewport.name}.png`, {
        fullPage: false,
        mask: [
          ...dynamicMasks(page),
          page.locator("article img"),
          page.locator("article :text('ago')")
        ]
      });
    });
  });
}
