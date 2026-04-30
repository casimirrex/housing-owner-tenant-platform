package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after scheduling a property visit")
public record VisitScheduleResponse(
    @Schema(description = "Visit id", example = "visit_1003")
    String visitId,
    @Schema(description = "Visit status", example = "SCHEDULED")
    String status,
    @Schema(description = "Scheduled timestamp", example = "2026-04-12T10:00:00+05:30")
    String scheduledAt,
    @Schema(description = "Property summary")
    VisitPropertySummaryResponse propertySummary
) {
}
