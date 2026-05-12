/**
 * Base page object — all POMs extend this.
 *
 * Provides:
 *   - `page` access
 *   - `goto()`             — relative navigation with auto baseURL
 *   - `expectVisible()`    — shorthand for visibility assertion
 *   - `setLocale()`        — switch language via the LocaleSwitcher widget
 *   - `currentLocale()`    — read what locale the store thinks we're on
 */
import { expect, type Page } from "@playwright/test";

export type Locale = "en" | "hi" | "kn" | "ta";

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path = "/"): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectVisible(locator: string | ReturnType<Page["locator"]>): Promise<void> {
    const el = typeof locator === "string" ? this.page.locator(locator) : locator;
    await expect(el).toBeVisible();
  }

  /** Switch site locale via the header LocaleSwitcher `<select>` element. */
  async setLocale(locale: Locale): Promise<void> {
    const switcher = this.page.locator("header select").first();
    await switcher.selectOption(locale);

    // Auto-translator re-walks the DOM on locale change. Give it a tick.
    await this.page.waitForTimeout(300);
  }

  async currentLocale(): Promise<Locale> {
    const raw = await this.page.evaluate(() =>
      window.localStorage.getItem("testition-locale-v1")
    );
    if (!raw) return "en";
    try {
      const parsed = JSON.parse(raw);
      return (parsed?.state?.locale ?? "en") as Locale;
    } catch {
      return "en";
    }
  }

  /** Wait for the page chrome to be ready — header brand + locale switcher mounted. */
  async waitForChrome(): Promise<void> {
    await expect(this.page.locator("header")).toBeVisible();
  }
}
