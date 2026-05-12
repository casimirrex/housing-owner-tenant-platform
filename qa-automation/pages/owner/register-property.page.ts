import { expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * /owner/listings/new — owner property creation form.
 *
 * Required fields: title, propertyType, city, BHK, locality, rent.
 * Optional: deposit (auto-filled to 6× rent), furnishing, amenities, cover photo.
 *
 * Submit button text: "Publish property" (or "Save a property draft" for non-premium owners)
 * Loading state:    "Publishing property..."
 */
export type NewListingInput = {
  title: string;
  propertyType?: string;     // e.g. "Apartment"
  city?: string;             // e.g. "Bengaluru"
  bhk?: string;              // e.g. "2BHK"
  locality: string;
  rent: number;
  deposit?: number;
  furnishing?: string;       // e.g. "Furnished"
  amenities?: string;        // comma-separated
};

export class OwnerRegisterPropertyPage extends BasePage {
  readonly titleInput = () => this.page.getByLabel(/listing title/i);
  readonly propertyTypeSelect = () => this.page.getByLabel(/property type/i);
  readonly citySelect = () => this.page.getByLabel(/^city$/i);
  readonly bhkSelect = () => this.page.getByLabel(/^bhk$/i);
  readonly localityInput = () => this.page.getByLabel(/locality/i);
  readonly rentInput = () => this.page.getByLabel(/monthly rent/i);
  readonly depositInput = () => this.page.getByLabel(/deposit/i);
  readonly furnishingSelect = () => this.page.getByLabel(/furnishing/i);
  readonly amenitiesInput = () => this.page.getByLabel(/amenities/i);
  readonly submitButton = () =>
    this.page.getByRole("button", {
      name: /publish property|save (a )?property draft|publishing property…/i
    });

  async open(): Promise<void> {
    await this.goto("/owner/listings/new");
    await this.waitForChrome();
    await expect(this.titleInput()).toBeVisible({ timeout: 15_000 });
  }

  async fill(input: NewListingInput): Promise<void> {
    await this.titleInput().fill(input.title);
    if (input.propertyType) await this.propertyTypeSelect().selectOption(input.propertyType);
    if (input.city) await this.citySelect().selectOption(input.city);
    if (input.bhk) await this.bhkSelect().selectOption(input.bhk);
    await this.localityInput().fill(input.locality);
    await this.rentInput().fill(String(input.rent));
    if (input.deposit !== undefined) await this.depositInput().fill(String(input.deposit));
    if (input.furnishing) await this.furnishingSelect().selectOption(input.furnishing);
    if (input.amenities) await this.amenitiesInput().fill(input.amenities);
  }

  async submit(): Promise<void> {
    await this.submitButton().click();
  }

  async expectValidationError(field: RegExp): Promise<void> {
    await expect(this.page.locator(".text-copper").filter({ hasText: field }).first()).toBeVisible();
  }
}
