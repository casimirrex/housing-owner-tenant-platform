package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Property specification details")
public record PropertySpecsResponse(
    @Schema(description = "BHK configuration", example = "2BHK")
    String bhk,
    @Schema(description = "Bathroom count", example = "2")
    int bathrooms,
    @Schema(description = "Balcony count", example = "1")
    int balconies,
    @Schema(description = "Built-up area in square feet", example = "1180")
    int areaSqFt,
    @Schema(description = "Furnishing status", example = "Semi Furnished")
    String furnishing,
    @Schema(description = "Floor number", example = "3")
    int floor,
    @Schema(description = "Total floors in the building", example = "8")
    int totalFloors,
    @Schema(description = "Main facing direction", example = "East")
    String facing,
    @Schema(description = "Parking availability", example = "1 covered parking")
    String parking
) {
}
