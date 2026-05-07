package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Saved search row with criteria + alert counts")
public record SavedSearchResponse(
    @Schema(description = "Search id", example = "ss_abc123")
    String searchId,

    @Schema(description = "User-visible name", example = "Indiranagar 2BHK under 35k")
    String name,

    @Schema(description = "City filter", example = "Bengaluru")
    String city,

    @Schema(description = "Free-text query", example = "Indiranagar")
    String query,

    @Schema(description = "BHK options")
    List<String> bhk,

    @Schema(description = "Furnishing filter", example = "Semi Furnished")
    String furnishing,

    @Schema(description = "Require verified", example = "false")
    Boolean verified,

    @Schema(description = "Min rent", example = "20000")
    Integer rentMin,

    @Schema(description = "Max rent", example = "35000")
    Integer rentMax,

    @Schema(description = "Notification email if any", example = "tenant@example.com")
    String notificationEmail,

    @Schema(description = "Whether alerts are firing", example = "true")
    boolean active,

    @Schema(description = "ISO created timestamp", example = "2026-05-08T10:00:00Z")
    String createdAt,

    @Schema(description = "Number of NEW (unread) alerts on this search", example = "3")
    long unreadAlerts,

    @Schema(description = "Number of total alerts on this search", example = "12")
    long totalAlerts
) {}
