package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Pricing information for a property")
public record PropertyPricingResponse(
    @Schema(description = "Monthly rent", example = "32000")
    int monthlyRent,
    @Schema(description = "Security deposit", example = "96000")
    int securityDeposit,
    @Schema(description = "Monthly maintenance", example = "3500")
    int maintenance,
    @Schema(description = "Brokerage charge", example = "0")
    int brokerage,
    @Schema(description = "Available from date", example = "2026-04-15")
    String availableFrom
) {
}
