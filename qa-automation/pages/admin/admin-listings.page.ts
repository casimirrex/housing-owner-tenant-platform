import { expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * /admin/listings — moderation queue.
 *
 * Table columns: Listing, Owner, Status, Rent, Flags, Action.
 * Status select per row is the moderation action (DRAFT / PUBLISHED /
 * SUSPENDED / REJECTED). Mutating it fires adminModerateListing().
 */
export type AdminListingStatus = "DRAFT" | "PUBLISHED" | "SUSPENDED" | "REJECTED";

export class AdminListingsPage extends BasePage {
  readonly tableHeading = () => this.page.locator("th", { hasText: /^listing$/i }).first();
  readonly rows = () => this.page.locator("tbody tr");
  readonly emptyMessage = () =>
    this.page.getByText(/no listings|nothing to moderate/i);

  rowByTitle(title: string) {
    return this.page.locator("tr", { has: this.page.getByRole("link", { name: title }) }).first();
  }

  async open(): Promise<void> {
    await this.goto("/admin/listings");
    // Wait for admin gate to resolve.
    await expect(this.page.getByText(/checking admin access/i)).toBeHidden({
      timeout: 15_000
    });
    await expect(this.tableHeading()).toBeVisible();
  }

  async rowCount(): Promise<number> {
    return this.rows().count();
  }

  async moderate(title: string, newStatus: AdminListingStatus): Promise<void> {
    const row = this.rowByTitle(title);
    await expect(row).toBeVisible({ timeout: 10_000 });
    const action = row.locator("select").first();
    await action.selectOption(newStatus);
  }

  async expectStatus(title: string, status: AdminListingStatus): Promise<void> {
    const row = this.rowByTitle(title);
    await expect(row).toContainText(status);
  }

  async expectFlagged(title: string): Promise<void> {
    const row = this.rowByTitle(title);
    // Flagged rows have a rose tint applied to the <tr>.
    await expect(row).toHaveClass(/bg-rose-50/);
  }
}
