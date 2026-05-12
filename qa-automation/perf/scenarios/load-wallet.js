/**
 * Authenticated load test — wallet view + topup checkout.
 *
 * Each VU:
 *   1. Logs in once in setup() — token reused across iterations
 *   2. Hits /wallet (dashboard read)
 *   3. 20% of users initiate a topup checkout (write path, hits Stripe SDK)
 *
 * Run:  k6 run -e ENV=local perf/scenarios/load-wallet.js
 */
import http from "k6/http";
import { check } from "k6";
import { getEnv } from "../config/env.js";
import { ENDPOINT_SLOS, merge } from "../config/thresholds.js";
import { loginOnce, authHeaders } from "../helpers/auth.js";
import { thinkTime, tag } from "../helpers/utils.js";

export const options = {
  scenarios: {
    wallet_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "1m",  target: 20 },
        { duration: "3m",  target: 20 },
        { duration: "30s", target: 0 }
      ]
    }
  },
  thresholds: merge(ENDPOINT_SLOS.wallet, ENDPOINT_SLOS.walletTopup)
};

export function setup() {
  return { token: loginOnce() };
}

export default function (data) {
  const env = getEnv();
  const headers = authHeaders(data.token);

  // 1. Wallet dashboard read.
  const dashboard = http.get(`${env.apiBase}/api/v1/wallet`, Object.assign({ headers }, tag("wallet")));
  check(dashboard, { "wallet 200": (r) => r.status === 200 });

  // 2. 20% of iterations attempt a topup.
  if (Math.random() < 0.2) {
    const amount = [500, 1000, 2000, 5000][Math.floor(Math.random() * 4)];
    const topup = http.post(
      `${env.apiBase}/api/v1/wallet/topup/checkout`,
      JSON.stringify({ amount, currency: "INR" }),
      Object.assign({ headers }, tag("wallet_topup"))
    );
    check(topup, {
      "topup checkout 200": (r) => r.status === 200,
      "topup returns txnId": (r) => !!(r.json() && r.json().txnId)
    });
  }

  thinkTime(2, 6);
}
