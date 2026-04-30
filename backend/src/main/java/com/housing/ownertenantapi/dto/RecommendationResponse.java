package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Personalized or rules-based recommendation response")
public record RecommendationResponse(
    @Schema(description = "Recommended items")
    List<RecommendationItemResponse> items,
    @Schema(description = "Pagination metadata")
    PaginationResponse pagination
) {
}
