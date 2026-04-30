package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Paginated property review payload")
public record PropertyReviewsResponse(
    @Schema(description = "Property reviews")
    List<PropertyReviewItemResponse> reviews,
    @Schema(description = "Rating summary")
    PropertyRatingSummaryResponse ratingSummary,
    @Schema(description = "Total review count", example = "28")
    long totalCount
) {
}
