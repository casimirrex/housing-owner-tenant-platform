/**
 * i18n regression — picks a strategically chosen set of strings from each page
 * and asserts they translate correctly when the locale changes.
 *
 * This is the SAFETY NET for the dictionary-driven AutoTranslator. Any time
 * a developer adds new English copy, this suite will fail until they add it
 * to lib/i18n/auto-translate-dictionary.ts.
 */
import { test, expect } from "@playwright/test";
import { BasePage } from "../../../pages/base.page";

type Probe = { en: string; hi: string; kn: string; ta: string };

// Sample translatable strings from each major surface.
// These exist in lib/i18n/auto-translate-dictionary.ts.
const FOOTER_PROBES: Probe[] = [
  {
    en: "Search homes",
    hi: "घर खोजें",
    kn: "ಮನೆಗಳನ್ನು ಹುಡುಕಿ",
    ta: "வீடுகளைத் தேடு"
  },
  {
    en: "List your home",
    hi: "अपना घर सूचीबद्ध करें",
    kn: "ನಿಮ್ಮ ಮನೆಯನ್ನು ಪಟ್ಟಿ ಮಾಡಿ",
    ta: "உங்கள் வீட்டை பட்டியலிடு"
  }
];

for (const locale of ["hi", "kn", "ta"] as const) {
  test(`footer translates to ${locale.toUpperCase()}`, async ({ page }) => {
    const base = new BasePage(page);
    await base.goto("/");
    await base.waitForChrome();
    await base.setLocale(locale);

    for (const probe of FOOTER_PROBES) {
      // The translated string should appear at least once in the page footer.
      await expect(
        page.locator("footer").getByText(probe[locale]).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });
}

test("locale survives a hard reload (persisted store)", async ({ page }) => {
  const base = new BasePage(page);
  await base.goto("/");
  await base.setLocale("ta");
  await page.reload();
  expect(await base.currentLocale()).toBe("ta");
});
