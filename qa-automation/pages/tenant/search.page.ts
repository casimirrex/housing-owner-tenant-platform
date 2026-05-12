import { expect } from "@playwright/test";
import { BasePage } from "../base.page";

export class SearchPage extends BasePage {
  readonly cityInput = () => this.page.getByPlaceholder(/city|locality|where/i).first();
  readonly searchButton = () => this.page.getByRole("button", { name: /search/i }).first();
  readonly listingCards = () => this.page.locator("article");
  readonly saveSearchButton = () => this.page.getByRole("button", { name: /save this search/i });

  async open(): Promise<void> {
    await this.goto("/search");
    await this.waitForChrome();
  }

  async searchByCity(city: string): Promise<void> {
    await this.cityInput().fill(city);
    await this.searchButton().click();
    await this.page.waitForLoadState("networkidle");
  }

  async expectResults(min = 1): Promise<void> {
    await expect(this.listingCards().first()).toBeVisible();
    expect(await this.listingCards().count()).toBeGreaterThanOrEqual(min);
  }
}
