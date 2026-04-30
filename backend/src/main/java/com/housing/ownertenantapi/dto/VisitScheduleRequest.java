package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to schedule a visit")
public record VisitScheduleRequest(
    @NotBlank
    @Schema(description = "Property id", example = "listing_001")
    String propertyId,
    @NotBlank
    @Schema(description = "Slot id", example = "slot_morning_1")
    String slotId,
    @NotBlank
    @Schema(description = "Preferred date", example = "2026-04-12")
    String preferredDate,
    @Schema(description = "Optional notes for the visit",
        example = "Please call 15 minutes before arrival.")
    String notes
) {
}
