/**
 * Misc helpers used across scenarios.
 */
import { sleep } from "k6";

/**
 * Realistic think time — randomised between min and max seconds.
 * Real users don't fire requests back-to-back; this is the most important
 * lever in distinguishing synthetic vs realistic load patterns.
 */
export function thinkTime(minSec = 1, maxSec = 4) {
  const delay = minSec + Math.random() * (maxSec - minSec);
  sleep(delay);
}

/** Tag helper — shorthand for the request-tag pattern used everywhere. */
export function tag(endpoint) {
  return { tags: { endpoint } };
}
