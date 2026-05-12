/**
 * i18n visual regression — the same screen in all 4 locales.
 *
 * Critical because Tamil / Kannada / Hindi scripts have different
 * character widths and line-heights. Layout that works in English can
 * overflow buttons or wrap awkwardly in Tamil. This catches that BEFORE
 * a user reports it.
 *
 * Snapshots: 4 PNGs per locale per page — keep this list short.
 */
import { test, expect } from "@playwright/test";
import { prepareForSnapshot, dismissTransientUi, dynamicMasks } from "../../pages/visual.helpers";

const LOCALES = ["en", "hi", "kn", "ta"] as const;

for (const locale of LOCALES) {
  test(`visual: homepage hero in ${locale.toUpperCase()}`, async ({ page }) => {
    await page.goto("/");
    await dismissTransientUi(page);

    // Set locale via the persisted store BEFORE the auto-translator scans.
    await page.evaluate((loc) => {
      window.localStorage.setItem(
        "testition-locale-v1",
        JSON.stringify({ state: { locale: loc }, version: 0 })
      );
    }, locale);
    await page.reload();
    await dismissTransientUi(page);

    // Let the auto-translator finish walking the DOM.
    await page.waitForTimeout(800);
    await prepareForSnapshot(page);

    await expect(page).toHaveScreenshot(`homepage-${locale}.png`, {
      fullPage: false,
      mask: dynamicMasks(page),
      // Multilingual text antialiases slightly differently across runs;
      // give a tiny bit more headroom than the default 1%.
      maxDiffPixelRatio: 0.02
    });
  });
}
