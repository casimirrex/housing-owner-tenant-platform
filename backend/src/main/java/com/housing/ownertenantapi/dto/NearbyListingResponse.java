package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Listing card with distance, used for 'Near me' search")
public record NearbyListingResponse(
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
    @Schema(description = "Whether the listing is currently featured", example = "false")
    boolean featured,
    @Schema(description = "Human-readable freshness label", example = "Added 2 hours ago")
    String postedLabel,
    @Schema(description = "Urgency label if applicable", example = "High demand")
    String urgencyLabel,
    @Schema(description = "Latitude", example = "12.9716")
    double lat,
    @Schema(description = "Longitude", example = "77.5946")
    double lng,
    @Schema(description = "Great-circle distance from the search center, in km", example = "1.23")
    double distanceKm
) {
}
