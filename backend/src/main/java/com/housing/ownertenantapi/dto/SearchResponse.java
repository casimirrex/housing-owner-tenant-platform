package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Standard listing search response")
public record SearchResponse(
    @Schema(description = "Matching listings")
    List<ListingSummaryResponse> items,
    @Schema(description = "Pagination details")
    PaginationResponse pagination,
    @Schema(description = "Filters applied to this search")
    SearchAppliedFiltersResponse appliedFilters,
    @Schema(description = "Search summary metadata")
    SearchSummaryResponse summary
) {
}
