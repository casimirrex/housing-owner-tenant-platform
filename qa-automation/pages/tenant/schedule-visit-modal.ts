import { expect, type Page } from "@playwright/test";

/**
 * Schedule Visit modal — opened from PropertyDetailPage.
 *
 * The modal renders a 14-day horizontal date picker, then loads slots for
 * the selected date, then a notes textarea, then Confirm/Cancel.
 */
export class ScheduleVisitModal {
  constructor(private readonly page: Page) {}

  readonly dialog = () => this.page.getByText(/schedule a visit/i).first().locator("xpath=ancestor::div[contains(@class,'rounded')][1]");
  readonly availableTimeSlotsHeading = () => this.page.getByText(/available time slots/i);
  readonly notesTextarea = () => this.page.getByPlaceholder(/parking guidance|please call 15 minutes/i);
  readonly confirmButton = () => this.page.getByRole("button", { name: /^confirm visit$|^scheduling…$/i });
  readonly cancelButton = () => this.page.getByRole("button", { name: /^cancel$/i });

  async waitForOpen(): Promise<void> {
    await expect(this.availableTimeSlotsHeading()).toBeVisible({ timeout: 10_000 });
  }

  async selectFirstAvailableSlot(): Promise<void> {
    // Slot buttons are the buttons inside the slot grid that are NOT disabled.
    const enabledSlot = this.page
      .locator("button:has(svg.lucide-clock):not([disabled])")
      .first();
    await enabledSlot.click();
  }

  async fillNotes(notes: string): Promise<void> {
    await this.notesTextarea().fill(notes);
  }

  async confirm(): Promise<void> {
    await this.confirmButton().click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton().click();
  }

  async expectError(message: RegExp | string): Promise<void> {
    await expect(this.page.locator(".bg-red-50, [role='alert']").first()).toContainText(message);
  }
}
