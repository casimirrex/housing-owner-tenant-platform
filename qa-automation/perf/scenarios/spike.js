/**
 * Spike test — sudden 10× traffic surge.
 *
 * Models a marketing burst: TV ad, viral tweet, Diwali offer. The system
 * sits idle, then 200 VUs hit it in 30 seconds, ride for 1 minute, fall
 * back to baseline.
 *
 * Pass criteria (loose, by design):
 *   - No 5xx during recovery (post-spike)
 *   - p95 returns to baseline within 1 min of ramp-down
 *
 * Run:  k6 run -e ENV=staging perf/scenarios/spike.js
 */
import http from "k6/http";
import { check } from "k6";
import { getEnv } from "../config/env.js";
import { randomSearchQuery, buildSearchUrl } from "../helpers/data.js";
import { tag } from "../helpers/utils.js";

export const options = {
  scenarios: {
    spike: {
      executor: "ramping-vus",
      startVUs: 5,
      stages: [
        { duration: "1m",  target: 5 },     // baseline
        { duration: "30s", target: 200 },   // SPIKE
        { duration: "1m",  target: 200 },   // hold
        { duration: "30s", target: 5 },     // ramp down
        { duration: "1m",  target: 5 }      // recovery — observe stability
      ]
    }
  },
  thresholds: {
    "http_req_failed{phase:recovery}": ["rate<0.02"],
    "http_req_duration": ["p(95)<3000"]
  }
};

export default function () {
  const env = getEnv();
  const res = http.get(buildSearchUrl(env.apiBase, randomSearchQuery()), tag("search"));
  check(res, { "search ok": (r) => r.status === 200 });
}
