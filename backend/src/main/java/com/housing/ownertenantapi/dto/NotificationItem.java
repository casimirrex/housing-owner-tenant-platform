package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Unified notification item, aggregated from multiple sources")
public record NotificationItem(
    @Schema(example = "alert_a1b2") String id,
    @Schema(example = "SAVED_SEARCH",
        allowableValues = {
            "SAVED_SEARCH","MAINTENANCE_UPDATE","LEAD_REQUEST",
            "VISIT_UPDATE","OWNER_REVIEW","LISTING_REPORT"
        })
    String type,
    @Schema(example = "New 2BHK matches your saved search") String title,
    @Schema(example = "₹32k in Indiranagar, posted just now") String body,
    @Schema(example = "/properties/listing_001") String href,
    @Schema(example = "2026-05-09T10:00:00Z") String createdAt,
    @Schema(example = "false") boolean read,
    @Schema(example = "NORMAL") String priority
) {
}
