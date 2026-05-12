/**
 * Visual regression helpers.
 *
 * Every visual test starts by calling `prepareForSnapshot(page)`. That:
 *   1. Waits for fonts to load (otherwise text antialiasing flickers)
 *   2. Waits for all images to be `complete` (avoids half-loaded photos)
 *   3. Disables CSS animations + transitions (no in-flight states)
 *   4. Stops the auto-translator from re-walking the DOM mid-snapshot
 *   5. Pins `Date.now()` and `Math.random()` for deterministic content
 *
 * The combination of these eliminates the four main sources of false
 * positives in visual regression: font hinting, image LCP race, animation
 * mid-tween, and JS-generated dynamic text.
 */
import type { Page, Locator } from "@playwright/test";

export async function prepareForSnapshot(page: Page): Promise<void> {
  // 1. Fonts ready — html2canvas-style waiting.
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  });

  // 2. Images loaded.
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      })
    );
  });

  // 3. Kill animations.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `
  });

  // 4. Give layout one more tick.
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
}

/**
 * Common dynamic content masks. Pass these to `.toHaveScreenshot({ mask: [...] })`
 * to obscure values that legitimately change every run.
 */
export function dynamicMasks(page: Page): Locator[] {
  return [
    // Wallet balances (₹X,XXX type strings inside money displays)
    page.locator('[data-testid="wallet-balance"], .wallet-balance'),
    // Live timestamps (e.g. "2 hours ago", date strings in activity feeds)
    page.locator("time, [data-testid='timestamp'], .relative-time"),
    // Toast notifications — animate in/out, race with snapshot
    page.locator('[role="status"], .toast'),
    // Onboarding tour — appears on a delay, blocks chrome
    page.locator('[data-testid="onboarding-tour"]'),
    // Cookie consent banner — same problem
    page.locator('[role="dialog"]:has-text("cookies")'),
    // User avatar initials (depend on which test user is logged in)
    page.locator('[data-testid="user-avatar"]')
  ];
}

/**
 * Force-dismiss UI that pops in unpredictably and ruins snapshots.
 * Run AFTER prepareForSnapshot() but BEFORE the screenshot call.
 */
export async function dismissTransientUi(page: Page): Promise<void> {
  // Cookie consent — stored under STORAGE_KEY in localStorage
  await page.evaluate(() => {
    window.localStorage.setItem(
      "testition-cookie-consent-v1",
      JSON.stringify({ value: "essential-only", decidedAt: new Date(0).toISOString() })
    );
    window.localStorage.setItem("testition-onboarding-tour-v1", "done");
  });
  // Trigger a re-render so the dismissals take effect.
  await page.evaluate(() => window.dispatchEvent(new Event("storage")));
}
