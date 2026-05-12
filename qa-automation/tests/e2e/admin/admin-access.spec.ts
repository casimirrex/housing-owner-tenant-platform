/**
 * Admin access regression — exactly the failure mode that bit us in production
 * (https://testition.tech/admin/* returning 404 for non-admin users).
 *
 * Locks down:
 *   1. ADMIN user can reach /admin AND every sub-page
 *   2. TENANT user is redirected away from /admin
 *   3. Unauthenticated visitor is redirected to /account/login
 *   4. None of the canonical admin URLs 404 (catches deploy/build skew)
 */
import { test, expect } from "@playwright/test";
import { AdminOverviewPage } from "../../../pages/admin/admin-overview.page";
import { STORAGE } from "../../../fixtures/auth.setup";

const ADMIN_URLS = [
  "/admin",
  "/admin/users",
  "/admin/listings",
  "/admin/reports",
  "/admin/refunds",
  "/admin/audit-log"
];

test.describe("admin access — ADMIN role", () => {
  test.use({ storageState: STORAGE.ADMIN });

  test("admin can reach /admin overview", async ({ page }) => {
    const admin = new AdminOverviewPage(page);
    await admin.open();
    await admin.assertAllTabsVisible();
  });

  for (const url of ADMIN_URLS) {
    test(`admin URL "${url}" returns 200 (never 404)`, async ({ page }) => {
      const response = await page.goto(url);
      expect(response, `no response for ${url}`).not.toBeNull();
      expect(response!.status(), `status for ${url}`).toBeLessThan(400);
      // The Next.js 404 page renders this exact text — fail loud if seen.
      await expect(page.getByText(/this page could not be found/i)).toHaveCount(0);
    });
  }
});

test.describe("admin access — TENANT role gating", () => {
  test.use({ storageState: STORAGE.TENANT });

  test("tenant is redirected away from /admin", async ({ page }) => {
    await page.goto("/admin");
    // Layout's role gate redirects non-admin sessions to "/".
    await page.waitForURL((url) => !url.pathname.startsWith("/admin"), {
      timeout: 10_000
    });
    expect(page.url()).not.toContain("/admin");
  });
});

test.describe("admin access — unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("anonymous visitor is sent to login when hitting /admin", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/account\/login|tenant\/login/, { timeout: 10_000 });
  });
});
