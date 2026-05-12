import { test, expect } from "@playwright/test";
import { LoginPage } from "../../../pages/login.page";

test("@smoke valid credentials sign user in", async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();

  await login.loginAs(
    process.env.TENANT_EMAIL ?? "aarav@example.com",
    process.env.TENANT_PASSWORD ?? "StrongPassword@123"
  );

  // After login we leave /account/login.
  await page.waitForURL((url) => !url.pathname.startsWith("/account/login"), {
    timeout: 15_000
  });

  // JWT lives in the auth store.
  const hasSession = await page.evaluate(() => {
    const raw = window.localStorage.getItem("testition-auth-v1");
    return !!raw && !!JSON.parse(raw)?.state?.session?.accessToken;
  });
  expect(hasSession).toBe(true);
});

test("@smoke invalid credentials show an error", async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.loginAs("nobody@example.com", "wrong-password-zzz");
  await login.expectInvalidCredentials();
});
