import { expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * /wallet — tenant wallet top-up + history.
 *
 * Flow recap:
 *   1. /wallet renders the dashboard with current balance + recent activity
 *   2. Selecting a preset OR typing a custom amount enables the "Add money" CTA
 *   3. Clicking the CTA opens a Stripe (or demo) checkout modal
 *   4. On success a toast / banner confirms "Wallet topped up"
 */
export class WalletPage extends BasePage {
  // Header chrome
  readonly walletEyebrow = () => this.page.getByText(/^Wallet$/).first();

  // Top-up form
  readonly customAmountInput = () => this.page.getByPlaceholder(/e\.g\. 3000/i);
  readonly presetButton = (rupees: number) =>
    this.page.getByRole("button", { name: new RegExp(`₹\\s?${rupees.toLocaleString("en-IN")}`) });
  readonly addMoneyButton = () =>
    this.page.getByRole("button", { name: /add money to wallet|continue|starting checkout|pay/i });

  // Banners
  readonly errorBanner = () =>
    this.page.locator("text=Something went wrong").locator("..").first();
  readonly successBanner = () =>
    this.page.locator(".bg-emerald-50, [data-testid='wallet-success']").first();

  // Activity
  readonly recentActivity = () =>
    this.page.getByRole("heading", { name: /recent activity/i });

  async open(): Promise<void> {
    await this.goto("/wallet");
    await this.waitForChrome();
    // If unauthenticated the page renders a "Sign in" CTA instead.
    await expect(this.walletEyebrow()).toBeVisible({ timeout: 15_000 });
  }

  async enterCustomAmount(rupees: number): Promise<void> {
    await this.customAmountInput().fill(String(rupees));
  }

  async pickPreset(rupees: number): Promise<void> {
    await this.presetButton(rupees).click();
  }

  async clickAddMoney(): Promise<void> {
    await this.addMoneyButton().click();
  }

  async expectActivityVisible(): Promise<void> {
    await expect(this.recentActivity()).toBeVisible();
  }

  async expectErrorContains(text: RegExp | string): Promise<void> {
    await expect(this.errorBanner()).toContainText(text);
  }
}
