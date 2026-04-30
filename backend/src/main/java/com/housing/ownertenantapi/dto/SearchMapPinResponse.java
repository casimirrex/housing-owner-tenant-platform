package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Map pin result for a listing")
public record SearchMapPinResponse(
    @Schema(description = "Listing id", example = "listing_001")
    String listingId,
    @Schema(description = "Listing title", example = "Sunny 2BHK near Indiranagar Metro")
    String title,
    @Schema(description = "Locality", example = "Indiranagar")
    String locality,
    @Schema(description = "Latitude", example = "12.9784")
    double lat,
    @Schema(description = "Longitude", example = "77.6408")
    double lng,
    @Schema(description = "Rent", example = "32000")
    int rent,
    @Schema(description = "Whether the listing is verified", example = "true")
    boolean verified
) {
}
