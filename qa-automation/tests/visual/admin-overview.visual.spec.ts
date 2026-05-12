/**
 * Admin overview visual baseline — ADMIN role.
 *
 * Captures the moderation console chrome. The cards' data (active users,
 * fraud count, pending refunds) varies wildly per env, so the metric
 * numbers are masked — we're checking layout, spacing, badges, nav.
 */
import { test, expect } from "@playwright/test";
import { STORAGE } from "../../fixtures/auth.setup";
import {
  prepareForSnapshot,
  dismissTransientUi,
  dynamicMasks
} from "../../pages/visual.helpers";

test.use({ storageState: STORAGE.ADMIN });

test("visual: admin overview console", async ({ page }) => {
  await page.goto("/admin");
  await dismissTransientUi(page);

  // Wait for the auth gate to clear before snapshotting.
  await expect(page.getByText(/checking admin access/i)).toBeHidden({
    timeout: 15_000
  });
  await prepareForSnapshot(page);

  await expect(page).toHaveScreenshot("admin-overview.png", {
    fullPage: true,
    mask: [
      ...dynamicMasks(page),
      // Metric values vary per env
      page.locator("[data-testid='admin-metric-value']"),
      page.locator("text=/^\\d+$/"), // raw digit-only cells inside cards
      // Signed-in-as line shows current user
      page.locator("text=/Signed in as/")
    ]
  });
});

test("visual: admin nav bar", async ({ page }) => {
  await page.goto("/admin");
  await dismissTransientUi(page);
  await expect(page.getByText(/checking admin access/i)).toBeHidden({
    timeout: 15_000
  });
  await prepareForSnapshot(page);

  const nav = page.locator("nav").first();
  await expect(nav).toBeVisible();
  await expect(nav).toHaveScreenshot("admin-nav.png");
});
