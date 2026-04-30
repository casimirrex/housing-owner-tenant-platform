package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "A recommended listing with scoring metadata")
public record RecommendationItemResponse(
    @Schema(description = "Listing id", example = "listing_001")
    String listingId,
    @Schema(description = "Listing title", example = "Sunny 2BHK near Indiranagar Metro")
    String title,
    @Schema(description = "Locality name", example = "Indiranagar")
    String locality,
    @Schema(description = "City name", example = "Bengaluru")
    String city,
    @Schema(description = "Monthly rent", example = "32000")
    int rent,
    @Schema(description = "BHK type", example = "2BHK")
    String bhk,
    @Schema(description = "Whether the listing is verified", example = "true")
    boolean verified,
    @Schema(description = "Whether the listing is premium", example = "true")
    boolean premium,
    @Schema(description = "Freshness label", example = "Added 2 hours ago")
    String postedLabel,
    @Schema(description = "Recommendation reason", example = "Matches your commute and budget range")
    String recommendationReason,
    @Schema(description = "Recommendation score", example = "0.94")
    double score
) {
}
