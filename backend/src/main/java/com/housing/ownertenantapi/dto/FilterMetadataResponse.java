package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Available filter metadata for search screens")
public record FilterMetadataResponse(
    @Schema(description = "Budget range buckets")
    List<String> budgetRanges,
    @Schema(description = "Available BHK options")
    List<String> bhkOptions,
    @Schema(description = "Available furnishing options")
    List<String> furnishingOptions,
    @Schema(description = "Available tenant types")
    List<String> tenantTypes,
    @Schema(description = "Quick filters for faster discovery")
    List<String> quickFilters
) {
}
