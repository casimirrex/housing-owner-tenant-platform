/**
 * Stress test — find the breaking point.
 *
 * Ramps from 0 → 300 VUs over 20 minutes. The point isn't to hit a target
 * SLO; the point is to discover where the system starts failing. The
 * thresholds here are LOOSE so the test runs to completion and we can
 * read the curves in the report.
 *
 * What to look for in the output:
 *   - At what VU count does http_req_duration p95 spike?
 *   - When does http_req_failed start rising?
 *   - Does the backend recover after we ramp back down? (memory leaks)
 *
 * Run:  k6 run -e ENV=staging perf/scenarios/stress.js
 *
 * WARNING: do not run against production without authorisation.
 */
import http from "k6/http";
import { check } from "k6";
import { getEnv } from "../config/env.js";
import { randomSearchQuery, buildSearchUrl } from "../helpers/data.js";
import { tag } from "../helpers/utils.js";

export const options = {
  scenarios: {
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m",  target: 50 },
        { duration: "5m",  target: 100 },
        { duration: "5m",  target: 200 },
        { duration: "5m",  target: 300 },
        { duration: "3m",  target: 0 }
      ],
      gracefulRampDown: "30s"
    }
  },
  thresholds: {
    // Loose ceiling — we *expect* breaches; we just want the test to
    // continue and the report to show where they happen.
    "http_req_failed": ["rate<0.30"],
    "http_req_duration{endpoint:search}": ["p(99)<5000"]
  }
};

export default function () {
  const env = getEnv();
  const res = http.get(buildSearchUrl(env.apiBase, randomSearchQuery()), tag("search"));
  check(res, { "search responded": (r) => r.status > 0 });
}
