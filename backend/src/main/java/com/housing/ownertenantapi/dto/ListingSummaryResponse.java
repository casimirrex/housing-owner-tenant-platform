package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Compact listing card used in discovery APIs")
public record ListingSummaryResponse(
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
    @Schema(description = "Whether the listing is currently featured (paid promotion)", example = "false")
    boolean featured,
    @Schema(description = "Human-readable freshness label", example = "Added 2 hours ago")
    String postedLabel,
    @Schema(description = "Urgency label if applicable", example = "High demand")
    String urgencyLabel
) {
}
