import { test, expect } from "@playwright/test";

/**
 * Smoke #1 — homepage loads and shows brand chrome.
 * Cheapest possible "is the site alive?" check. Runs in every CI tier.
 */
test("@smoke homepage loads with Rent Beyond brand", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Testition|Rent Beyond/i);
  await expect(page.getByText(/Rent Beyond/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /search/i }).first()).toBeVisible();
});

test("@smoke locale switcher mounts in the header", async ({ page }) => {
  await page.goto("/");
  const switcher = page.locator("header select").first();
  await expect(switcher).toBeVisible();
  // Confirm all four locales are options.
  const options = await switcher.locator("option").allTextContents();
  expect(options.length).toBeGreaterThanOrEqual(4);
});

test("@smoke search page renders results", async ({ page }) => {
  await page.goto("/search");
  // At least one listing card should render from the seed dataset.
  await expect(page.locator("article").first()).toBeVisible({ timeout: 15_000 });
});
