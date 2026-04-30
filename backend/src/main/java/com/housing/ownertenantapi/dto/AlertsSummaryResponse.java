package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Summary of user alerts for the tenant dashboard")
public record AlertsSummaryResponse(
    @Schema(description = "Unread alerts count", example = "5")
    int unreadCount,
    @Schema(description = "Urgent alerts count", example = "2")
    int urgentCount,
    @Schema(description = "Latest summary label",
        example = "2 upcoming visits and 3 new match alerts")
    String latestSummary
) {
}
