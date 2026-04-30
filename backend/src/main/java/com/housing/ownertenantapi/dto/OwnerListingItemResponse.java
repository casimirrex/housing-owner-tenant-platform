package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Owner listing item")
public record OwnerListingItemResponse(
    @Schema(description = "Listing id", example = "owner_listing_2001")
    String listingId,
    @Schema(description = "Listing title", example = "Bright 2BHK near Electronic City")
    String title,
    @Schema(description = "Property type", example = "Apartment")
    String propertyType,
    @Schema(description = "City", example = "Bengaluru")
    String city,
    @Schema(description = "Locality", example = "Electronic City")
    String locality,
    @Schema(description = "Monthly rent", example = "28000")
    int rent,
    @Schema(description = "Security deposit", example = "84000")
    int deposit,
    @Schema(description = "BHK configuration", example = "2BHK")
    String bhk,
    @Schema(description = "Furnishing status", example = "Semi Furnished")
    String furnishing,
    @Schema(description = "Amenities")
    List<String> amenities,
    @Schema(description = "Photo URLs")
    List<String> photos,
    @Schema(description = "Availability date", example = "2026-04-20")
    String availabilityDate,
    @Schema(description = "Latitude", example = "12.8456")
    double lat,
    @Schema(description = "Longitude", example = "77.6603")
    double lng,
    @Schema(description = "Listing status", example = "DRAFT")
    String status,
    @Schema(description = "Created timestamp", example = "2026-04-09T07:00:00Z")
    String createdAt
) {
}
