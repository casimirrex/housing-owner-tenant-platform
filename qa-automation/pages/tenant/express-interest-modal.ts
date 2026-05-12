import { expect, type Page } from "@playwright/test";

/**
 * Express Interest modal — paid lead (Rs 49 from wallet).
 *
 * Visible elements:
 *   - Headline "Send a paid lead"
 *   - Optional message textarea (max 1000 chars)
 *   - CTA: "Pay Rs 49 & send interest" (text mutates while pending)
 */
export class ExpressInterestModal {
  constructor(private readonly page: Page) {}

  readonly headline = () => this.page.getByText(/send a paid lead/i);
  readonly messageTextarea = () =>
    this.page.getByPlaceholder(/looking to move in|pet friendly/i);
  readonly sendButton = () =>
    this.page.getByRole("button", { name: /pay rs.*&.*send interest|sending…/i });
  readonly cancelButton = () => this.page.getByRole("button", { name: /^cancel$/i });

  async waitForOpen(): Promise<void> {
    await expect(this.headline()).toBeVisible({ timeout: 5_000 });
  }

  async setMessage(message: string): Promise<void> {
    await this.messageTextarea().fill(message);
  }

  async send(): Promise<void> {
    await this.sendButton().click();
  }

  async expectInsufficientWallet(): Promise<void> {
    await expect(
      this.page.locator(".bg-red-50, [role='alert']").first()
    ).toContainText(/wallet|insufficient|balance/i);
  }
}
