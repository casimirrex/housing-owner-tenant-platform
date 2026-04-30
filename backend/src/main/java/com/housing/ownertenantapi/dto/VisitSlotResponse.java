package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Available visit slot for a property")
public record VisitSlotResponse(
    @Schema(description = "Slot id", example = "slot_morning_1")
    String slotId,
    @Schema(description = "Display label", example = "10:00 AM - 10:30 AM")
    String label,
    @Schema(description = "Slot start time", example = "10:00")
    String startTime,
    @Schema(description = "Slot end time", example = "10:30")
    String endTime,
    @Schema(description = "Whether the slot is available", example = "true")
    boolean available
) {
}
