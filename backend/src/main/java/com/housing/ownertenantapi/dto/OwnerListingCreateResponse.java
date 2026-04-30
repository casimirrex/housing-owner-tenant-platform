package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after creating an owner listing")
public record OwnerListingCreateResponse(
    @Schema(description = "Listing id", example = "owner_listing_2001")
    String listingId,
    @Schema(description = "Creation status", example = "DRAFT")
    String status,
    @Schema(description = "Creation timestamp", example = "2026-04-09T07:00:00Z")
    String createdAt
) {
}
