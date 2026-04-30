package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Core property information for the detail page")
public record PropertyCoreResponse(
    @Schema(description = "Property id", example = "listing_001")
    String propertyId,
    @Schema(description = "Listing title", example = "Sunny 2BHK near Indiranagar Metro")
    String title,
    @Schema(description = "Short subtitle", example = "Verified family-friendly apartment in a gated community")
    String subtitle,
    @Schema(description = "Locality", example = "Indiranagar")
    String locality,
    @Schema(description = "City", example = "Bengaluru")
    String city,
    @Schema(description = "Full address", example = "12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru")
    String address,
    @Schema(description = "Long-form property description",
        example = "Bright 2BHK with metro access, natural light, and a responsive owner.")
    String description,
    @Schema(description = "Current availability status", example = "AVAILABLE")
    String availabilityStatus,
    @Schema(description = "Image gallery URLs")
    List<String> imageUrls
) {
}
