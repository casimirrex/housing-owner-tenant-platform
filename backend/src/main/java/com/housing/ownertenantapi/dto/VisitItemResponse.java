package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Scheduled or completed visit item")
public record VisitItemResponse(
    @Schema(description = "Visit id", example = "visit_1001")
    String visitId,
    @Schema(description = "Visit status", example = "SCHEDULED")
    String status,
    @Schema(description = "Scheduled timestamp", example = "2026-04-12T10:00:00+05:30")
    String scheduledAt,
    @Schema(description = "Preferred date", example = "2026-04-12")
    String preferredDate,
    @Schema(description = "Slot id", example = "slot_morning_1")
    String slotId,
    @Schema(description = "Slot label", example = "10:00 AM - 10:30 AM")
    String slotLabel,
    @Schema(description = "Tenant notes", example = "Please call 15 minutes before arrival.")
    String notes,
    @Schema(description = "Property summary")
    VisitPropertySummaryResponse propertySummary
) {
}
