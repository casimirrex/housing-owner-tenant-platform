import { expect } from "@playwright/test";
import { BasePage } from "../base.page";
import { ScheduleVisitModal } from "./schedule-visit-modal";
import { ExpressInterestModal } from "./express-interest-modal";

/**
 * /properties/[propertyId] — listing detail page.
 *
 * Tenant-side CTAs become visible only when the session has `fullAccess`
 * (verified profile + sufficient wallet balance). Tests that need the CTAs
 * should pre-seed those conditions.
 */
export class PropertyDetailPage extends BasePage {
  readonly title = () => this.page.locator("h1, h2").first();
  readonly expressInterestButton = () =>
    this.page.getByRole("button", { name: /express interest/i });
  readonly scheduleVisitButton = () =>
    this.page.getByRole("button", { name: /schedule a visit/i });
  readonly messageOwnerButton = () =>
    this.page.getByRole("button", { name: /message.*owner|chat/i });
  readonly reportButton = () => this.page.getByRole("button", { name: /^report$/i });
  readonly leaveReviewButton = () =>
    this.page.getByRole("button", { name: /leave a verified review/i });

  async open(propertyId: string): Promise<void> {
    await this.goto(`/properties/${propertyId}`);
    await this.waitForChrome();
    await expect(this.title()).toBeVisible({ timeout: 15_000 });
  }

  async openScheduleVisitModal(): Promise<ScheduleVisitModal> {
    await this.scheduleVisitButton().click();
    const modal = new ScheduleVisitModal(this.page);
    await modal.waitForOpen();
    return modal;
  }

  async openExpressInterestModal(): Promise<ExpressInterestModal> {
    await this.expressInterestButton().click();
    const modal = new ExpressInterestModal(this.page);
    await modal.waitForOpen();
    return modal;
  }
}
