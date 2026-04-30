package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Owner-facing collections summary")
public record OwnerPaymentOverviewResponse(
    @Schema(description = "Amount collected this month", example = "96000")
    int collectedThisMonth,
    @Schema(description = "Amount still pending from tenants", example = "37000")
    int pendingAmount,
    @Schema(description = "Number of collected payments", example = "1")
    int collectedCount,
    @Schema(description = "How many listings have payment activity", example = "2")
    int listingsCovered
) {
}
