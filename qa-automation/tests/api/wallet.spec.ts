import { test, expect } from "@playwright/test";
import { ApiClient } from "../../api/client";
import { AuthApi } from "../../api/auth.api";
import { WalletApi } from "../../api/wallet.api";

test.describe("API: wallet", () => {
  let client: ApiClient;
  let token: string;

  test.beforeAll(async ({ request }) => {
    const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";
    client = new ApiClient(request, apiBase);
    const login = await AuthApi.login(
      client,
      process.env.TENANT_EMAIL ?? "aarav@example.com",
      process.env.TENANT_PASSWORD ?? "StrongPassword@123"
    );
    token = login.accessToken;
  });

  test("GET /wallet returns dashboard with balance + transactions", async () => {
    const dashboard = await WalletApi.dashboard(client, token);
    expect(dashboard).toMatchObject({
      balance: expect.any(Number),
      currency: expect.any(String),
      recentTransactions: expect.any(Array)
    });
    expect(dashboard.balance).toBeGreaterThanOrEqual(0);
  });

  test("POST /wallet/topup/checkout — valid amount returns a checkout intent", async () => {
    const res = await WalletApi.createTopup(client, token, 500);
    expect(res).toMatchObject({
      txnId: expect.any(String),
      amount: 500,
      currency: "INR",
      providerMode: expect.stringMatching(/STRIPE|MOCK/)
    });
  });

  test("POST /wallet/topup/checkout — amount below ₹1 is rejected", async () => {
    const res = await client.raw("post", "/api/v1/wallet/topup/checkout", {
      token,
      body: { amount: 0, currency: "INR" }
    });
    expect([400, 422]).toContain(res.status());
  });

  test("/wallet without auth is 401", async () => {
    const res = await client.raw("get", "/api/v1/wallet");
    expect(res.status()).toBe(401);
  });
});
