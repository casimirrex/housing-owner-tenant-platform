/**
 * Test-data generators for perf scenarios.
 *
 * Keep the input distribution REALISTIC. Don't slam a single hot row of
 * the index — that's a synthetic worst case that flatters the cache.
 *
 * We rotate through 4 seed cities, multiple BHK types, and varied rent
 * ranges so the DB sees the same access pattern a real workday produces.
 */
import { randomItem, randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

const CITIES = ["Bengaluru", "Pune", "Hyderabad", "Chennai"];
const BHK = ["1BHK", "2BHK", "3BHK", "Studio"];

export function randomSearchQuery() {
  return {
    city: randomItem(CITIES),
    bhk: randomItem(BHK),
    rentMax: randomIntBetween(15_000, 70_000)
  };
}

export function buildSearchUrl(apiBase, q) {
  const params = new URLSearchParams();
  if (q.city) params.set("city", q.city);
  if (q.bhk) params.set("bhk", q.bhk);
  if (q.rentMax) params.set("rentMax", String(q.rentMax));
  return `${apiBase}/api/v1/properties/search?${params.toString()}`;
}
