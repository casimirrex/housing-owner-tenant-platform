package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Composite home screen payload")
public record HomeResponse(
    @Schema(description = "Hero search configuration")
    HomeHeroSearchConfigResponse heroSearchConfig,
    @Schema(description = "Recommended listings for the user")
    List<RecommendationItemResponse> recommendations,
    @Schema(description = "Trending listings")
    List<ListingSummaryResponse> trending,
    @Schema(description = "Newly added listings")
    List<ListingSummaryResponse> newListings,
    @Schema(description = "Premium and verified listings")
    List<ListingSummaryResponse> premiumVerified,
    @Schema(description = "Urgent listings")
    List<ListingSummaryResponse> urgencyListings
) {
}
