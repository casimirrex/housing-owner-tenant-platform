import { expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * /admin overview console.
 *
 * Note: the admin layout has an auth gate that renders "Checking admin access…"
 * while session rehydration runs; we wait for that to clear before asserting.
 */
export class AdminOverviewPage extends BasePage {
  readonly heading = () => this.page.getByRole("heading", { name: /operations console/i });
  readonly tabs = {
    overview: () => this.page.getByRole("link", { name: /overview/i }),
    users: () => this.page.getByRole("link", { name: /^users$/i }),
    listings: () => this.page.getByRole("link", { name: /^listings$/i }),
    reports: () => this.page.getByRole("link", { name: /^reports$/i }),
    refunds: () => this.page.getByRole("link", { name: /refunds/i }),
    auditLog: () => this.page.getByRole("link", { name: /audit log/i })
  };

  async open(): Promise<void> {
    await this.goto("/admin");
    await this.waitForGate();
    await expect(this.heading()).toBeVisible();
  }

  async waitForGate(timeoutMs = 15_000): Promise<void> {
    // Layout shows "Checking admin access…" until Zustand rehydrates the session.
    await expect(this.page.getByText(/checking admin access/i))
      .toBeHidden({ timeout: timeoutMs });
  }

  async assertAllTabsVisible(): Promise<void> {
    await expect(this.tabs.overview()).toBeVisible();
    await expect(this.tabs.users()).toBeVisible();
    await expect(this.tabs.listings()).toBeVisible();
    await expect(this.tabs.reports()).toBeVisible();
    await expect(this.tabs.refunds()).toBeVisible();
    await expect(this.tabs.auditLog()).toBeVisible();
  }
}
