package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Paginated listing collection")
public record ListingCollectionResponse(
    @Schema(description = "Listings in the current page")
    List<ListingSummaryResponse> items,
    @Schema(description = "Total listing count before pagination", example = "24")
    long totalCount
) {
}
