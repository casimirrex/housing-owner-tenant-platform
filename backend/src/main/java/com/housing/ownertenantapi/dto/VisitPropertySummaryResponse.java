package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Compact property summary used in visit flows")
public record VisitPropertySummaryResponse(
    @Schema(description = "Property id", example = "listing_001")
    String propertyId,
    @Schema(description = "Property title", example = "Sunny 2BHK near Indiranagar Metro")
    String title,
    @Schema(description = "Locality", example = "Indiranagar")
    String locality,
    @Schema(description = "City", example = "Bengaluru")
    String city,
    @Schema(description = "Preview image URL",
        example = "https://images.example.com/listings/listing_001/cover.jpg")
    String imageUrl
) {
}
