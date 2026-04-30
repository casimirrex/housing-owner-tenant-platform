package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "A review shown on the property detail page")
public record PropertyReviewItemResponse(
    @Schema(description = "Review id", example = "review_9001")
    String reviewId,
    @Schema(description = "Reviewer display name", example = "Priya S.")
    String reviewerName,
    @Schema(description = "Numeric rating", example = "5")
    int rating,
    @Schema(description = "Review headline", example = "Very smooth visit experience")
    String headline,
    @Schema(description = "Review body",
        example = "The owner was responsive and the listing matched the photos.")
    String comment,
    @Schema(description = "Reviewer type", example = "Tenant")
    String reviewerType,
    @Schema(description = "When the review was published", example = "2026-03-28")
    String createdAt
) {
}
