package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Suggested rent range for the owner based on comparable listings")
public record PricingRecommendationResponse(
    @Schema(example = "Bengaluru") String city,
    @Schema(example = "Indiranagar") String locality,
    @Schema(example = "2BHK") String bhk,
    @Schema(example = "12") int comparableCount,
    @Schema(example = "27000") long medianRent,
    @Schema(example = "23000") long p25Rent,
    @Schema(example = "33000") long p75Rent,
    @Schema(example = "Listings within 25 percent of median sit between ₹23k–₹33k.") String summary,
    @Schema(example = "WIDE", allowableValues = {"NARROW", "WIDE", "INSUFFICIENT_DATA"})
    String confidence
) {
}
