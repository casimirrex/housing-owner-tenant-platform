package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Filters applied to a standard search")
public record SearchAppliedFiltersResponse(
    @Schema(description = "Free-text query", example = "metro")
    String query,
    @Schema(description = "City filter", example = "Bengaluru")
    String city,
    @Schema(description = "Minimum budget", example = "15000")
    Integer budgetMin,
    @Schema(description = "Maximum budget", example = "35000")
    Integer budgetMax,
    @Schema(description = "BHK filter", example = "2BHK")
    String bhk,
    @Schema(description = "Furnishing filter", example = "Semi Furnished")
    String furnishing,
    @Schema(description = "Tenant type filter", example = "WORKING_PROFESSIONAL")
    String tenantType,
    @Schema(description = "Pet-friendly filter", example = "true")
    Boolean petFriendly,
    @Schema(description = "Verified filter", example = "true")
    Boolean verified,
    @Schema(description = "Sort order", example = "relevance")
    String sortBy
) {
}
