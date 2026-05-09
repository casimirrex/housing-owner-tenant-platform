package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Owner review summary + recent reviews")
public record OwnerReviewsResponse(
    @Schema(example = "user_42") String ownerId,
    @Schema(example = "4.6")     double averageRating,
    @Schema(example = "12")      int totalReviews,
    List<OwnerReviewItem> items
) {
}
