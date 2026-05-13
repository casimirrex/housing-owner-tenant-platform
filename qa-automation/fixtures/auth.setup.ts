/**
 * Auth setup — runs ONCE per CI run, before any project that depends on it.
 *
 * For each seeded role we:
 *   1. Visit the login page
 *   2. Submit the credentials
 *   3. Wait for redirect away from /account/login
 *   4. Save browser context (localStorage + cookies) to a JSON file
 *
 * Test files then opt into a role with:
 *   test.use({ storageState: "playwright/.auth/admin.json" })
 *
 * The Zustand auth store persists to localStorage, so this captures the JWT
 * and the user profile — exactly what the app reads on subsequent page loads.
 */
import { test as setup, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const AUTH_DIR = path.resolve(__dirname, "../playwright/.auth");

// Make sure the directory exists before writing into it.
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

const TENANT_FILE = path.join(AUTH_DIR, "tenant.json");
const OWNER_FILE = path.join(AUTH_DIR, "owner.json");
const ADMIN_FILE = path.join(AUTH_DIR, "admin.json");

async function login(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  expectedRedirect: RegExp
) {
  await page.goto("/account/login");
  // Label text on the real form is "Email or phone"; password label is just
  // "Password". Submit button reads "Login with email / phone" (mutates to
  // "Signing in..." while pending).
  await page.getByLabel(/email or phone|email/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /login with email|signing in/i }).click();

  // Successful login redirects away from /account/login.
  await page.waitForURL(expectedRedirect, { timeout: 20_000 });

  // Sanity check: the auth store should now hold a session.
  const session = await page.evaluate(() => {
    const raw = window.localStorage.getItem("testition-auth-v1");
    return raw ? JSON.parse(raw) : null;
  });
  expect(session?.state?.session?.accessToken).toBeTruthy();
}

setup("authenticate as TENANT", async ({ page }) => {
  await login(
    page,
    process.env.TENANT_EMAIL ?? "aarav@example.com",
    process.env.TENANT_PASSWORD ?? "StrongPassword@123",
    /\/(account\/dashboard|search|$)/
  );
  await page.context().storageState({ path: TENANT_FILE });
});

setup("authenticate as OWNER", async ({ page }) => {
  await login(
    page,
    process.env.OWNER_EMAIL ?? "rohit.mehta@example.com",
    process.env.OWNER_PASSWORD ?? "StrongPassword@123",
    /\/owner\/(dashboard|listings)/
  );
  await page.context().storageState({ path: OWNER_FILE });
});

setup("authenticate as ADMIN", async ({ page }) => {
  await login(
    page,
    process.env.ADMIN_EMAIL ?? "aarav@example.com",
    process.env.ADMIN_PASSWORD ?? "StrongPassword@123",
    /\/(account|admin|$)/
  );
  await page.context().storageState({ path: ADMIN_FILE });
});

export const STORAGE = {
  TENANT: TENANT_FILE,
  OWNER: OWNER_FILE,
  ADMIN: ADMIN_FILE
};
