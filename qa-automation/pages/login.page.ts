import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  readonly emailInput = () => this.page.getByLabel(/email/i);
  readonly passwordInput = () => this.page.getByLabel(/password/i);
  readonly submitButton = () => this.page.getByRole("button", { name: /sign in/i });
  readonly errorBanner = () => this.page.locator('[role="alert"], .error-banner').first();

  async open(): Promise<void> {
    await this.goto("/account/login");
    await expect(this.submitButton()).toBeVisible();
  }

  async loginAs(email: string, password: string): Promise<void> {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }

  async expectInvalidCredentials(): Promise<void> {
    await expect(this.errorBanner()).toBeVisible();
    await expect(this.errorBanner()).toContainText(/invalid|incorrect|wrong/i);
  }
}
