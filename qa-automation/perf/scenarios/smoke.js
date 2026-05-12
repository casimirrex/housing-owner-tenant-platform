/**
 * Smoke — 1 VU, 30s. Verifies every critical endpoint responds.
 *
 * Use this as a pre-flight before any heavier run. If the smoke fails, the
 * env isn't ready and there is no point loading it.
 *
 * Run:  k6 run -e ENV=local perf/scenarios/smoke.js
 */
import http from "k6/http";
import { check } from "k6";
import { getEnv } from "../config/env.js";
import { tag } from "../helpers/utils.js";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    "checks": ["rate>0.99"], // 99%+ of checks pass
    "http_req_failed": ["rate<0.01"]
  }
};

export default function () {
  const env = getEnv();

  // 1. Search endpoint
  const search = http.get(
    `${env.apiBase}/api/v1/properties/search?city=Bengaluru`,
    tag("search")
  );
  check(search, {
    "search 200": (r) => r.status === 200,
    "search has results array": (r) => Array.isArray(r.json() && r.json().results)
  });

  // 2. Login endpoint
  const login = http.post(
    `${env.apiBase}/api/v1/auth/login`,
    JSON.stringify({ email: env.tenantEmail, password: env.tenantPassword }),
    Object.assign({ headers: { "Content-Type": "application/json" } }, tag("login"))
  );
  check(login, {
    "login 200": (r) => r.status === 200,
    "login returns JWT": (r) => !!(r.json() && r.json().accessToken)
  });
}
