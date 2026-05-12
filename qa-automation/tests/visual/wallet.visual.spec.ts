/**
 * Wallet visual baseline — tenant role.
 *
 * Three masks are critical here:
 *   - Wallet balance (literally changes every test run)
 *   - Recent activity timestamps + amounts
 *   - Transaction IDs in the table
 *
 * We snapshot the chrome + form, not the data.
 */
import { test, expect } from "@playwright/test";
import { STORAGE } from "../../fixtures/auth.setup";
import { prepareForSnapshot, dismissTransientUi, dynamicMasks } from "../../pages/visual.helpers";

test.use({ storageState: STORAGE.TENANT });

test("visual: wallet page (data masked)", async ({ page }) => {
  await page.goto("/wallet");
  await dismissTransientUi(page);
  await prepareForSnapshot(page);

  // Wait for the topup form to render.
  await expect(page.getByText(/Wallet top-up|Quick top-up/i).first()).toBeVisible({
    timeout: 15_000
  });

  await expect(page).toHaveScreenshot("wallet-page.png", {
    fullPage: true,
    mask: [
      ...dynamicMasks(page),
      // Balance display — varies per env / per run
      page.locator("text=/₹[\\d,]+/"),
      // Recent activity rows — entirely volatile
      page.locator("table tbody, [data-testid='wallet-activity']"),
      // Stripe iframe (when present) renders differently per session
      page.locator("iframe[name*='stripe']")
    ],
    maxDiffPixelRatio: 0.02
  });
});
