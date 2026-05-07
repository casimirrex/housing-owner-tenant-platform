package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request body for promoting a listing — pick a duration tier")
public record ListingPromotionRequest(
    @NotNull
    @Schema(description = "How many days to keep this listing featured", example = "7",
        allowableValues = {"7", "30"})
    Integer durationDays
) {}
