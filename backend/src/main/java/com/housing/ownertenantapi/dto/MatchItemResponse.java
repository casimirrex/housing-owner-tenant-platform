package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "A matched property for the tenant matches page")
public record MatchItemResponse(
    @Schema(description = "Listing id", example = "listing_001")
    String listingId,
    @Schema(description = "Listing title", example = "Sunny 2BHK near Indiranagar Metro")
    String title,
    @Schema(description = "Locality", example = "Indiranagar")
    String locality,
    @Schema(description = "City", example = "Bengaluru")
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
    @Schema(description = "Match score", example = "0.93")
    double matchScore,
    @Schema(description = "Reason for the match",
        example = "Matches your saved commute and family-friendly preferences")
    String matchReason
) {
}
