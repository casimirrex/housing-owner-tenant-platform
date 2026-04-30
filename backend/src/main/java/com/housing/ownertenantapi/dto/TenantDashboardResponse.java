package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Tenant dashboard summary payload")
public record TenantDashboardResponse(
    @Schema(description = "Saved properties count", example = "4")
    int savedCount,
    @Schema(description = "Scheduled visits count", example = "2")
    int scheduledVisits,
    @Schema(description = "Recommended or matched properties count", example = "6")
    int recommendedCount,
    @Schema(description = "Profile completion percentage", example = "82")
    int profileCompletion,
    @Schema(description = "Alerts summary")
    AlertsSummaryResponse alertsSummary
) {
}
