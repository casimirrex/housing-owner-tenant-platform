import type { ApiClient } from "./client";

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user: {
    userId: string;
    email: string;
    fullName: string;
    role: "TENANT" | "OWNER" | "ADMIN";
  };
};

export const AuthApi = {
  async login(client: ApiClient, email: string, password: string): Promise<LoginResponse> {
    return client.post<LoginResponse>("/api/v1/auth/login", {
      body: { email, password }
    });
  },

  async loginExpectFailure(client: ApiClient, email: string, password: string): Promise<void> {
    const res = await client.raw("post", "/api/v1/auth/login", {
      body: { email, password }
    });
    if (res.status() === 200) {
      throw new Error("Expected login to fail, but it succeeded.");
    }
  },

  async me(client: ApiClient, token: string): Promise<LoginResponse["user"]> {
    const res = await client.get<{ user: LoginResponse["user"] }>("/api/v1/auth/me", { token });
    return res.user;
  }
};
