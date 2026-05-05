package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Status of a user's entitlement to a gated feature (free trial / premium)")
public record EntitlementResult(
    @Schema(description = "Whether the action is currently allowed", example = "true")
    boolean allowed,

    @Schema(description = "User's tier for this feature", example = "FREE",
        allowableValues = {"FREE", "PREMIUM"})
    String tier,

    @Schema(description = "How many free uses consumed so far", example = "2")
    int used,

    @Schema(description = "Free-tier limit; null when premium (unlimited)", example = "3", nullable = true)
    Integer limit,

    @Schema(description = "Status code", example = "FREE_REMAINING",
        allowableValues = {"PREMIUM", "FREE_REMAINING", "FREE_EXHAUSTED"})
    String status,

    @Schema(description = "User-facing message", example = "Free trial: 1 of 3 remaining.")
    String message
) {}
