package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Listing row in admin moderation queue")
public record AdminListingItem(
    @Schema(example = "listing_001")    String listingId,
    @Schema(example = "Sunny 2BHK …")  String title,
    @Schema(example = "Indiranagar")    String locality,
    @Schema(example = "Bengaluru")      String city,
    @Schema(example = "user_42")        String ownerId,
    @Schema(example = "Priya Sharma")   String ownerName,
    @Schema(example = "PUBLISHED")      String status,
    @Schema(example = "32000")          int rent,
    @Schema(example = "true")           boolean verified,
    @Schema(example = "false")          boolean featured,
    @Schema(example = "0")              int fraudScore,
    @Schema(example = "2")              int openReports,
    @Schema(example = "2026-05-01T08:00:00Z") String updatedAt
) {
}
