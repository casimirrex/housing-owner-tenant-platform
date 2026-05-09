package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Platform-wide stats shown on the admin dashboard")
public record AdminStatsResponse(
    @Schema(description = "Total registered users", example = "1532")
    long totalUsers,
    @Schema(description = "Owners (any user with OWNER role)", example = "412")
    long totalOwners,
    @Schema(description = "Tenants (any user with TENANT role)", example = "1120")
    long totalTenants,
    @Schema(description = "Total listings (any status)", example = "238")
    long totalListings,
    @Schema(description = "Listings with status = PUBLISHED", example = "187")
    long publishedListings,
    @Schema(description = "Listings with fraud_score > 0", example = "4")
    long flaggedListings,
    @Schema(description = "Open listing reports", example = "12")
    long openReports,
    @Schema(description = "Visits scheduled in the last 7 days", example = "47")
    long recentVisits,
    @Schema(description = "Chat threads opened in the last 7 days", example = "82")
    long recentChats
) {
}
