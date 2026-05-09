package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Confirmation of a listing report")
public record ListingReportResponse(
    @Schema(description = "Report id", example = "rpt_a1b2c3d4")
    String reportId,
    @Schema(description = "Listing id", example = "listing_001")
    String listingId,
    @Schema(description = "Reason code", example = "FAKE_LISTING")
    String reason,
    @Schema(description = "Status", example = "OPEN")
    String status,
    @Schema(description = "ISO timestamp when reported", example = "2026-05-09T10:00:00Z")
    String createdAt
) {
}
