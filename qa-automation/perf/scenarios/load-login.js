/**
 * Load test — /auth/login throughput.
 *
 * Use case: marketing burst lands a SMS campaign at 9 AM — thousands of
 * users sign in at once. Login is bcrypt-bound on the backend; a slow
 * login is the cheapest single thing to detect.
 *
 * Constant-rate executor: hold a steady 30 req/sec for 3 minutes. This
 * isolates bcrypt cost from the variable rampup pattern of ramping-vus.
 *
 * Run:  k6 run -e ENV=local perf/scenarios/load-login.js
 */
import http from "k6/http";
import { check } from "k6";
import { getEnv } from "../config/env.js";
import { ENDPOINT_SLOS } from "../config/thresholds.js";
import { tag } from "../helpers/utils.js";

export const options = {
  scenarios: {
    login_load: {
      executor: "constant-arrival-rate",
      rate: 30,                    // 30 logins/sec
      timeUnit: "1s",
      duration: "3m",
      preAllocatedVUs: 30,
      maxVUs: 100
    }
  },
  thresholds: Object.assign({}, ENDPOINT_SLOS.login, {
    "checks": ["rate>0.99"]
  })
};

export default function () {
  const env = getEnv();
  const res = http.post(
    `${env.apiBase}/api/v1/auth/login`,
    JSON.stringify({ email: env.tenantEmail, password: env.tenantPassword }),
    Object.assign({ headers: { "Content-Type": "application/json" } }, tag("login"))
  );
  check(res, {
    "login 200": (r) => r.status === 200,
    "login has token": (r) => !!(r.json() && r.json().accessToken)
  });
}
