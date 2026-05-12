/**
 * Load test — /properties/search.
 *
 * Models the platform's hottest path. Ramps to 50 VUs, holds for 5 min,
 * ramps down. Each VU rotates through realistic search filters and
 * occasionally drills into a listing detail page (40% click-through rate).
 *
 * Run:  k6 run -e ENV=local perf/scenarios/load-search.js
 *
 * Expected p95 under this load: < 500ms for search, < 600ms for detail.
 */
import http from "k6/http";
import { check } from "k6";
import { getEnv } from "../config/env.js";
import { ENDPOINT_SLOS, merge } from "../config/thresholds.js";
import { randomSearchQuery, buildSearchUrl } from "../helpers/data.js";
import { thinkTime, tag } from "../helpers/utils.js";

export const options = {
  scenarios: {
    search_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },   // warm up
        { duration: "1m",  target: 50 },   // ramp to target
        { duration: "5m",  target: 50 },   // hold steady — main measurement window
        { duration: "30s", target: 0 }     // ramp down
      ],
      gracefulRampDown: "30s"
    }
  },
  thresholds: merge(ENDPOINT_SLOS.search, ENDPOINT_SLOS.propertyDetail, {
    "checks": ["rate>0.99"]
  })
};

export default function () {
  const env = getEnv();
  const q = randomSearchQuery();

  // 1. Search
  const searchRes = http.get(buildSearchUrl(env.apiBase, q), tag("search"));
  const okSearch = check(searchRes, {
    "search status 200": (r) => r.status === 200
  });

  // 2. 40% of users click into the first result.
  if (okSearch && Math.random() < 0.4) {
    const body = searchRes.json();
    const first = body && body.results && body.results[0];
    if (first && first.listingId) {
      const detail = http.get(
        `${env.apiBase}/api/v1/properties/${first.listingId}`,
        tag("property_detail")
      );
      check(detail, { "detail status 200": (r) => r.status === 200 });
    }
  }

  thinkTime(1, 4);
}
