package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record OwnerListingsBulkActionResponse(
    @Schema(example = "PAUSE")  String action,
    @Schema(example = "PAUSED") String resultingStatus,
    @Schema(example = "5")      int updatedCount,
    @Schema(example = "0")      int skippedCount
) {
}
