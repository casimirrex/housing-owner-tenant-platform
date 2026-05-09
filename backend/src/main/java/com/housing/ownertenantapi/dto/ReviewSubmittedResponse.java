package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Confirmation of a submitted review")
public record ReviewSubmittedResponse(
    @Schema(description = "Review id", example = "rev_a1b2c3d4")
    String reviewId,
    @Schema(description = "Property id", example = "listing_001")
    String listingId,
    @Schema(description = "Linked visit id", example = "visit_42")
    String visitId,
    @Schema(description = "Rating", example = "4")
    int rating,
    @Schema(description = "Whether this review is from a verified stay", example = "true")
    boolean verifiedStay
) {
}
