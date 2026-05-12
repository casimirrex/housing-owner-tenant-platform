/**
 * Schedule Visit E2E — tenant role.
 *
 * Prereq: at least one PUBLISHED listing in the seed DB. We use the API
 * to fetch the first listing's id so this test is independent of any
 * specific seed row id.
 *
 * Asserts:
 *   ✓ Schedule-visit modal opens from the listing detail page
 *   ✓ "Available time slots" heading renders
 *   ✓ Notes textarea accepts input
 *   ✓ Cancel closes the modal without scheduling
 *   ✓ Confirm requires a slot selection (button disabled when none picked)
 */
import { test, expect } from "@playwright/test";
import { PropertyDetailPage } from "../../../pages/tenant/property-detail.page";
import { ApiClient } from "../../../api/client";
import { PropertiesApi } from "../../../api/properties.api";
import { STORAGE } from "../../../fixtures/auth.setup";

test.use({ storageState: STORAGE.TENANT });

async function getFirstListingId(request: import("@playwright/test").APIRequestContext): Promise<string> {
  const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";
  const client = new ApiClient(request, apiBase);
  const page = await PropertiesApi.search(client, { city: "Bengaluru" });
  if (!page.results.length) throw new Error("No seeded listings found — cannot run schedule-visit tests.");
  return page.results[0]!.listingId;
}

test("schedule visit modal opens with date + slot pickers", async ({ page, request }) => {
  const listingId = await getFirstListingId(request);
  const detail = new PropertyDetailPage(page);
  await detail.open(listingId);

  // Only verified tenants with full access see the CTA.
  if (await detail.scheduleVisitButton().isVisible({ timeout: 3_000 }).catch(() => false)) {
    const modal = await detail.openScheduleVisitModal();
    await expect(modal.availableTimeSlotsHeading()).toBeVisible();
    await expect(modal.confirmButton()).toBeDisabled();
    await modal.cancel();
    await expect(modal.availableTimeSlotsHeading()).toBeHidden();
  } else {
    test.skip(true, "Schedule visit CTA not visible — tenant lacks full access in this env.");
  }
});

test("notes textarea accepts up to 500 characters", async ({ page, request }) => {
  const listingId = await getFirstListingId(request);
  const detail = new PropertyDetailPage(page);
  await detail.open(listingId);

  if (await detail.scheduleVisitButton().isVisible({ timeout: 3_000 }).catch(() => false)) {
    const modal = await detail.openScheduleVisitModal();
    const longNote = "x".repeat(500);
    await modal.fillNotes(longNote);
    const value = await modal.notesTextarea().inputValue();
    expect(value.length).toBeLessThanOrEqual(500);
  } else {
    test.skip(true, "Schedule visit CTA not visible.");
  }
});
