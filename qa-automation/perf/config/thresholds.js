/**
 * SLO thresholds — the contract between us and the user.
 *
 * Each entry is a named threshold map. k6 evaluates these at the end of a
 * run and EXITS NON-ZERO if any breach is detected → CI fails the build.
 *
 * Convention: use http_req_duration filtered by a tag named "endpoint".
 * Scenarios set this tag with `http.get(url, { tags: { endpoint: "search" } })`.
 */

export const ENDPOINT_SLOS = {
  // Search is the hottest read path. Most-visited endpoint.
  search: {
    "http_req_duration{endpoint:search}": ["p(95)<500", "p(99)<1000"],
    "http_req_failed{endpoint:search}": ["rate<0.01"]
  },
  // Login is auth-critical. Tight latency budget.
  login: {
    "http_req_duration{endpoint:login}": ["p(95)<300", "p(99)<800"],
    "http_req_failed{endpoint:login}": ["rate<0.005"]
  },
  // Listing detail can be heavier (joins photos, reviews, owner info).
  propertyDetail: {
    "http_req_duration{endpoint:property_detail}": ["p(95)<600", "p(99)<1200"],
    "http_req_failed{endpoint:property_detail}": ["rate<0.01"]
  },
  // Authenticated wallet view.
  wallet: {
    "http_req_duration{endpoint:wallet}": ["p(95)<400"],
    "http_req_failed{endpoint:wallet}": ["rate<0.01"]
  },
  // Wallet topup hits Stripe — slightly looser p95 to allow network variance.
  walletTopup: {
    "http_req_duration{endpoint:wallet_topup}": ["p(95)<800", "p(99)<2000"],
    "http_req_failed{endpoint:wallet_topup}": ["rate<0.02"]
  }
};

/** Merge multiple endpoint threshold maps into one for a scenario. */
export function merge(...maps) {
  return Object.assign({}, ...maps);
}
