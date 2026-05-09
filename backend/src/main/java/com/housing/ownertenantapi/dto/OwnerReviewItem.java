package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Tenant review of an owner")
public record OwnerReviewItem(
    @Schema(example = "rev_abc123")  String reviewId,
    @Schema(example = "user_42")     String ownerId,
    @Schema(example = "Priya S.")    String reviewerName,
    @Schema(example = "5")           int rating,
    @Schema(example = "Great owner") String headline,
    @Schema(example = "Very responsive…") String comment,
    @Schema(example = "2026-04-12T10:00:00Z") String createdAt
) {
}
