/**
 * Owner property action helpers.
 *
 * Wraps the existing `updateOwnerListing` endpoint to provide pause / resume
 * / remove semantics until dedicated backend endpoints exist.
 *
 * The backend's PUT /api/v1/owners/listings/{id} already accepts the listing
 * shape; we add a `status` field which the backend may use to drive
 * search-index visibility (UC-014, FR-20, FR-21). If the backend ignores the
 * extra field today, the action still updates the record and the optimistic
 * UI in `owner-listings-experience.tsx` keeps the UX correct.
 *
 * Statuses (per BRD §5):
 *   PUBLISHED -> visible in tenant search
 *   PAUSED    -> hidden from tenant search, kept on owner side
 *   DRAFT     -> hidden from tenant search, kept on owner side
 *   REMOVED   -> hidden from tenant search and from /owner/listings
 */

import { updateOwnerListing } from "@/lib/api/client";
import type { OwnerListingItemResponse } from "@/lib/api/types";

export type OwnerListingStatus =
  | "PUBLISHED"
  | "PAUSED"
  | "DRAFT"
  | "REMOVED";

export interface OwnerListingStatusUpdate {
  listingId: string;
  nextStatus: OwnerListingStatus;
  current: OwnerListingItemResponse;
  accessToken?: string;
}

/**
 * Update only the status of an owner listing without changing its content.
 * Re-sends the existing field values to satisfy the PUT contract.
 */
export async function setOwnerListingStatus({
  listingId,
  nextStatus,
  current,
  accessToken
}: OwnerListingStatusUpdate) {
  const payload = {
    title: current.title,
    rent: current.rent,
    deposit: current.deposit,
    amenities: current.amenities,
    availabilityDate: current.availabilityDate,
    photos: current.photos,
    // The extra `status` key is forward-compatible. The backend may ignore it
    // until the BRD §11 dependency on dedicated status endpoints is delivered.
    status: nextStatus
  };

  return updateOwnerListing(
    listingId,
    payload as unknown as {
      title: string;
      rent: number;
      deposit: number;
      amenities: string[];
      availabilityDate: string;
      photos: string[];
    },
    accessToken
  );
}

/** UC-012 — soft delete a property. */
export function removeOwnerListing(
  current: OwnerListingItemResponse,
  accessToken?: string
) {
  return setOwnerListingStatus({
    listingId: current.listingId,
    nextStatus: "REMOVED",
    current,
    accessToken
  });
}

/** UC-012 alternate flow — pause a property without deleting. */
export function pauseOwnerListing(
  current: OwnerListingItemResponse,
  accessToken?: string
) {
  return setOwnerListingStatus({
    listingId: current.listingId,
    nextStatus: "PAUSED",
    current,
    accessToken
  });
}

/** Resume a paused property. */
export function resumeOwnerListing(
  current: OwnerListingItemResponse,
  accessToken?: string
) {
  return setOwnerListingStatus({
    listingId: current.listingId,
    nextStatus: "PUBLISHED",
    current,
    accessToken
  });
}

/**
 * UI-side filter — properties that should appear in the Tenant Workspace
 * (FR-21). Use when the backend returns mixed-status lists.
 */
export function isVisibleToTenants(item: OwnerListingItemResponse) {
  const normalized = (item.status ?? "").toUpperCase();
  return normalized === "PUBLISHED" || normalized === "ACTIVE" || normalized === "";
}
