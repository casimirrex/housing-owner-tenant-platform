import type { ApiClient } from "./client";

export type WalletDashboard = {
  balance: number;
  currency: string;
  recentTransactions: Array<{
    txnId: string;
    amount: number;
    status: "PENDING" | "COMPLETED" | "FAILED";
    createdAt: string;
  }>;
};

export type WalletTopupCheckoutResponse = {
  txnId: string;
  amount: number;
  currency: string;
  providerMode: "STRIPE" | "MOCK";
  clientSecret?: string;
};

export const WalletApi = {
  dashboard(client: ApiClient, token: string): Promise<WalletDashboard> {
    return client.get<WalletDashboard>("/api/v1/wallet", { token });
  },

  createTopup(client: ApiClient, token: string, amount: number): Promise<WalletTopupCheckoutResponse> {
    return client.post<WalletTopupCheckoutResponse>("/api/v1/wallet/topup/checkout", {
      token,
      body: { amount, currency: "INR" }
    });
  }
};
