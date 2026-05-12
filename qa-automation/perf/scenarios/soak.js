/**
 * Soak test — sustained load for 30 min.
 *
 * Find slow-growing issues invisible at shorter durations:
 *   - Memory leaks (heap usage trend)
 *   - DB connection pool exhaustion
 *   - Disk-bound log writes filling up
 *   - Redis cache eviction storms
 *
 * Hold 20 VUs for 30 min. Compare p95 at t=5min vs t=25min — they should
 * be within 10%. A growing curve = leak.
 *
 * Run:  k6 run -e ENV=staging perf/scenarios/soak.js
 */
import http from "k6/http";
import { check } from "k6";
import { getEnv } from "../config/env.js";
import { randomSearchQuery, buildSearchUrl } from "../helpers/data.js";
import { thinkTime, tag } from "../helpers/utils.js";

export const options = {
  scenarios: {
    soak: {
      executor: "constant-vus",
      vus: 20,
      duration: "30m"
    }
  },
  thresholds: {
    "http_req_duration{endpoint:search}": ["p(95)<700"], // 10% looser than the load test
    "http_req_failed": ["rate<0.01"]
  }
};

export default function () {
  const env = getEnv();
  const res = http.get(buildSearchUrl(env.apiBase, randomSearchQuery()), tag("search"));
  check(res, { "search ok": (r) => r.status === 200 });
  thinkTime(2, 5);
}
