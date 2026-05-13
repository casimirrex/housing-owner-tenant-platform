import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * /account/login POM.
 *
 * Real-world DOM (from components/sections/auth-experience.tsx):
 *   - Email field label: "Email or phone"  (registers as "identifier")
 *   - Password field label: "Password"
 *   - Submit button text: "Login with email / phone"
 *     (mutates to "Signing in..." while loginMutation is pending)
 *   - Error banner copy on bad auth:
 *     "Sign-in did not complete. Please try again in a moment."
 *
 * Selectors below use those exact strings — regex-anchored loosely so a
 * future copy tweak (e.g. "Log in with email") doesn't immediately break.
 */
export class LoginPage extends BasePage {
  readonly emailInput = () => this.page.getByLabel(/email or phone|email/i);
  readonly passwordInput = () => this.page.getByLabel(/^password$/i);
  readonly submitButton = () =>
    this.page.getByRole("button", { name: /login with email|signing in/i });
  readonly errorBanner = () =>
    this.page.getByText(/sign-in did not complete|invalid credentials/i);

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
    await expect(this.errorBanner()).toBeVisible({ timeout: 15_000 });
  }
}
