package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Listing report row in admin queue")
public record AdminReportItem(
    @Schema(example = "rpt_a1b2c3")     String reportId,
    @Schema(example = "listing_001")    String listingId,
    @Schema(example = "Sunny 2BHK …")  String listingTitle,
    @Schema(example = "user_42")        String reporterUserId,
    @Schema(example = "Priya Sharma")   String reporterName,
    @Schema(example = "FAKE_LISTING")   String reason,
    @Schema(example = "Phone unreachable") String details,
    @Schema(example = "OPEN")           String status,
    @Schema(example = "2026-05-09T10:00:00Z") String createdAt,
    @Schema(example = "2026-05-09T11:00:00Z") String reviewedAt,
    @Schema(example = "Resolved – owner confirmed listing is rented") String resolutionNote
) {
}
