/**
 * Accessibility audit — WCAG 2.1 AA conformance check via axe-core.
 *
 * Why this matters: Indian Rights of Persons with Disabilities Act (2016)
 * and the DPDP-adjacent norms expect commercial websites to be a11y-friendly.
 * Failing axe rules block screen-reader users from completing rental flows.
 *
 * We test the canonical entry points; expand to every public page over time.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PUBLIC_ROUTES = [
  { path: "/", name: "homepage" },
  { path: "/search", name: "search" },
  { path: "/account/login", name: "login" },
  { path: "/account/register", name: "register" }
];

for (const route of PUBLIC_ROUTES) {
  test(`a11y: ${route.name} has no WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState("domcontentloaded");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Pretty-print violations on failure for fast triage.
    if (results.violations.length > 0) {
      console.log(
        JSON.stringify(
          results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.length
          })),
          null,
          2
        )
      );
    }
    expect(results.violations).toEqual([]);
  });
}
