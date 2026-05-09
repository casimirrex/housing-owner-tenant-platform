package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Whether the current user is allowed to submit a review for this listing")
public record ReviewEligibilityResponse(
    @Schema(description = "True only when the user has a COMPLETED visit and hasn't reviewed yet", example = "true")
    boolean eligible,
    @Schema(description = "Reason code", example = "OK", allowableValues = {
        "OK", "NEEDS_VISIT", "VISIT_NOT_COMPLETED", "ALREADY_REVIEWED", "NOT_AUTHENTICATED"
    })
    String reason,
    @Schema(description = "Human-readable explanation", example = "Schedule a visit before leaving a review.")
    String message
) {
}
