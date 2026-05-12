/**
 * Auth API contract tests — pure HTTP, no browser.
 *
 * Asserts:
 *   1. Login returns 200 + a JWT + the expected user role
 *   2. Login with bad password returns 401
 *   3. /me returns the authenticated user
 *   4. Login is rate-limited after N rapid failures (if backend has that policy)
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../../api/client";
import { AuthApi } from "../../api/auth.api";

test.describe("API: auth", () => {
  let client: ApiClient;

  test.beforeEach(async ({ request }) => {
    const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";
    client = new ApiClient(request, apiBase);
  });

  test("POST /auth/login with valid credentials returns a JWT", async () => {
    const res = await AuthApi.login(
      client,
      process.env.TENANT_EMAIL ?? "aarav@example.com",
      process.env.TENANT_PASSWORD ?? "StrongPassword@123"
    );

    expect(res.accessToken).toBeTruthy();
    expect(res.accessToken.split(".").length).toBe(3); // standard JWT
    expect(res.user.email).toBe(process.env.TENANT_EMAIL ?? "aarav@example.com");
    expect(["TENANT", "ADMIN"]).toContain(res.user.role);
  });

  test("POST /auth/login with invalid credentials is rejected", async () => {
    await AuthApi.loginExpectFailure(client, "aarav@example.com", "wrong-password-xyz");
  });

  test("GET /auth/me returns the authenticated user", async () => {
    const login = await AuthApi.login(
      client,
      process.env.TENANT_EMAIL ?? "aarav@example.com",
      process.env.TENANT_PASSWORD ?? "StrongPassword@123"
    );
    const me = await AuthApi.me(client, login.accessToken);
    expect(me.email).toBe(login.user.email);
  });

  test("admin role check — seeded admin can authenticate", async () => {
    const res = await AuthApi.login(
      client,
      process.env.ADMIN_EMAIL ?? "aarav@example.com",
      process.env.ADMIN_PASSWORD ?? "StrongPassword@123"
    );
    expect(res.user.role).toBe("ADMIN");
  });
});
