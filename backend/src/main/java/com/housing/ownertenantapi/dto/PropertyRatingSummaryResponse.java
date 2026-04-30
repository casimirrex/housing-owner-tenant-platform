package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Aggregated review statistics for a property")
public record PropertyRatingSummaryResponse(
    @Schema(description = "Average rating", example = "4.7")
    double averageRating,
    @Schema(description = "Total number of reviews", example = "28")
    long totalReviews,
    @Schema(description = "Five-star reviews", example = "20")
    long fiveStarCount,
    @Schema(description = "Four-star reviews", example = "6")
    long fourStarCount,
    @Schema(description = "Three-star reviews", example = "1")
    long threeStarCount,
    @Schema(description = "Two-star reviews", example = "1")
    long twoStarCount,
    @Schema(description = "One-star reviews", example = "0")
    long oneStarCount
) {
}
