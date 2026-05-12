/**
 * Random data helpers — used to create per-test isolated test data so parallel
 * tests never collide on email / listing-title uniqueness.
 */
import { randomBytes } from "crypto";

export function randomString(len = 8): string {
  return randomBytes(len)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, len);
}

export function randomEmail(prefix = "qa"): string {
  return `${prefix}.${randomString(6).toLowerCase()}@qa.testition.test`;
}

export function randomPhoneIN(): string {
  // Indian phone numbers start with +91 and a 9/8/7/6 prefix.
  const head = [9, 8, 7, 6][Math.floor(Math.random() * 4)];
  let rest = "";
  for (let i = 0; i < 9; i++) rest += Math.floor(Math.random() * 10).toString();
  return `+91${head}${rest}`;
}

export function randomRentINR(min = 8000, max = 80000): number {
  return Math.floor(Math.random() * (max - min) + min);
}
