/**
 * Wallet top-up E2E — tenant role.
 *
 *   ✓ Wallet page loads + recent activity visible
 *   ✓ Custom amount enables Add Money CTA
 *   ✓ Preset amount enables Add Money CTA
 *   ✓ Minimum-amount validation message
 *   ✓ Stripe checkout modal opens (does NOT submit a real payment)
 *
 * We do NOT actually charge Stripe in CI. The "Add money" click fires the
 * checkout creation; we assert that the Stripe element mounts then close.
 */
import { test, expect } from "@playwright/test";
import { WalletPage } from "../../../pages/tenant/wallet.page";
import { STORAGE } from "../../../fixtures/auth.setup";

test.use({ storageState: STORAGE.TENANT });

test("wallet page loads with recent activity", async ({ page }) => {
  const wallet = new WalletPage(page);
  await wallet.open();
  await wallet.expectActivityVisible();
});

test("preset amount enables Add Money button", async ({ page }) => {
  const wallet = new WalletPage(page);
  await wallet.open();

  // CTA should be disabled until an amount is selected.
  await expect(wallet.addMoneyButton()).toBeDisabled();

  await wallet.pickPreset(500);
  await expect(wallet.addMoneyButton()).toBeEnabled();
});

test("custom amount enables Add Money button", async ({ page }) => {
  const wallet = new WalletPage(page);
  await wallet.open();
  await wallet.enterCustomAmount(750);
  await expect(wallet.addMoneyButton()).toBeEnabled();
});

test("custom amount below minimum is rejected", async ({ page }) => {
  const wallet = new WalletPage(page);
  await wallet.open();
  await wallet.enterCustomAmount(0);
  await expect(page.getByText(/minimum top-up is ₹1/i)).toBeVisible();
});

test("Add Money opens checkout flow", async ({ page }) => {
  const wallet = new WalletPage(page);
  await wallet.open();
  await wallet.pickPreset(500);
  await wallet.clickAddMoney();

  // Either a Stripe Elements iframe or the mock demo card form mounts.
  const stripeOrMock = page.locator(
    "iframe[name*='__privateStripeFrame'], text=Demo payment, text=Stripe test card"
  );
  await expect(stripeOrMock.first()).toBeVisible({ timeout: 15_000 });
});
