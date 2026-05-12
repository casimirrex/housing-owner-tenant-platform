/**
 * Auth helpers — avoid re-logging-in 1000× during a load test.
 *
 * Strategy: log in ONCE per virtual user in the `setup()` phase, then pass
 * the token to every iteration via shared state. This matches a realistic
 * pattern (browser auth headers are stable for a session).
 */
import http from "k6/http";
import { check } from "k6";
import { getEnv } from "../config/env.js";

/**
 * Called by scenarios' setup() function to obtain a JWT for the test run.
 * Returns the token string, which k6 hands back to the default function
 * as its first argument.
 */
export function loginOnce() {
  const env = getEnv();
  if (!env.tenantEmail || !env.tenantPassword) {
    throw new Error(
      `Auth credentials missing for env "${env.name}". Set tenantEmail/tenantPassword.`
    );
  }

  const res = http.post(
    `${env.apiBase}/api/v1/auth/login`,
    JSON.stringify({ email: env.tenantEmail, password: env.tenantPassword }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "login_setup" }
    }
  );
  const ok = check(res, {
    "setup login is 200": (r) => r.status === 200,
    "setup login returns token": (r) => !!(r.json() && r.json().accessToken)
  });
  if (!ok) {
    throw new Error(`Setup login failed: ${res.status} ${res.body && res.body.slice(0, 200)}`);
  }
  return res.json().accessToken;
}

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}
