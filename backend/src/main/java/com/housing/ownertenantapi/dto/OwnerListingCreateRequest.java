package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Schema(description = "Request to create a new owner listing")
public record OwnerListingCreateRequest(
    @NotBlank
    @Schema(description = "Listing title", example = "Bright 2BHK near Electronic City")
    String title,
    @NotBlank
    @Schema(description = "Property type", example = "Apartment")
    String propertyType,
    @NotBlank
    @Schema(description = "City", example = "Bengaluru")
    String city,
    @NotBlank
    @Schema(description = "Locality", example = "Electronic City")
    String locality,
    @NotNull
    @Schema(description = "Monthly rent", example = "28000")
    Integer rent,
    @NotNull
    @Schema(description = "Security deposit", example = "84000")
    Integer deposit,
    @NotBlank
    @Schema(description = "BHK configuration", example = "2BHK")
    String bhk,
    @NotBlank
    @Schema(description = "Furnishing status", example = "Semi Furnished")
    String furnishing,
    @NotEmpty
    @Schema(description = "Amenities")
    List<String> amenities,
    @NotEmpty
    @Schema(description = "Photo URLs")
    List<String> photos,
    @NotNull
    @Schema(description = "Latitude", example = "12.8456")
    Double lat,
    @NotNull
    @Schema(description = "Longitude", example = "77.6603")
    Double lng
) {
}
