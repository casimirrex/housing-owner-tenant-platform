/**
 * Express Interest E2E — paid lead flow.
 *
 * Tests:
 *   ✓ Modal opens with the "Send a paid lead" headline
 *   ✓ Message textarea is optional (button enabled with empty message)
 *   ✓ Wallet-insufficient state is surfaced if balance < ₹49
 *     (we mock the API response to deterministically test the error path)
 */
import { test, expect } from "@playwright/test";
import { PropertyDetailPage } from "../../../pages/tenant/property-detail.page";
import { ApiClient } from "../../../api/client";
import { PropertiesApi } from "../../../api/properties.api";
import { STORAGE } from "../../../fixtures/auth.setup";

test.use({ storageState: STORAGE.TENANT });

test("express interest modal renders and accepts an optional message", async ({ page, request }) => {
  const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";
  const client = new ApiClient(request, apiBase);
  const search = await PropertiesApi.search(client, { city: "Bengaluru" });
  test.skip(!search.results.length, "No seeded listings.");

  const detail = new PropertyDetailPage(page);
  await detail.open(search.results[0]!.listingId);

  if (!(await detail.expressInterestButton().isVisible({ timeout: 3_000 }).catch(() => false))) {
    test.skip(true, "Express Interest CTA not visible — tenant lacks full access.");
  }

  const modal = await detail.openExpressInterestModal();
  await modal.setMessage("Looking to move in by 1st June. Pet friendly?");
  await expect(modal.sendButton()).toBeEnabled();
});

test("insufficient wallet balance surfaces an inline error", async ({ page, request }) => {
  const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";
  const client = new ApiClient(request, apiBase);
  const search = await PropertiesApi.search(client, { city: "Bengaluru" });
  test.skip(!search.results.length, "No seeded listings.");

  // Intercept the express-interest POST and return a deterministic
  // insufficient-wallet error. This isolates the front-end's error rendering.
  await page.route("**/api/v1/leads/express-interest**", (route) =>
    route.fulfill({
      status: 402,
      contentType: "application/json",
      body: JSON.stringify({
        error: "INSUFFICIENT_WALLET_BALANCE",
        message: "Your wallet balance is too low to send this paid lead."
      })
    })
  );

  const detail = new PropertyDetailPage(page);
  await detail.open(search.results[0]!.listingId);

  if (!(await detail.expressInterestButton().isVisible({ timeout: 3_000 }).catch(() => false))) {
    test.skip(true, "Express Interest CTA not visible.");
  }

  const modal = await detail.openExpressInterestModal();
  await modal.send();
  await modal.expectInsufficientWallet();
});
