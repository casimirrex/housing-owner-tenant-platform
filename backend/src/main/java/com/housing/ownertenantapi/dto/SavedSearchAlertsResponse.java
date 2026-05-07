package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Alerts inbox for the signed-in tenant")
public record SavedSearchAlertsResponse(
    @Schema(description = "Alerts, newest first")
    List<Alert> alerts,

    @Schema(description = "Number of NEW (unread) alerts", example = "5")
    long unreadCount
) {
  @Schema(description = "Single alert: a new listing matched a saved search")
  public record Alert(
      @Schema(description = "Alert id", example = "al_x1y2z3")
      String alertId,

      @Schema(description = "Saved search that matched", example = "ss_abc123")
      String searchId,

      @Schema(description = "Saved search name", example = "Indiranagar 2BHK under 35k")
      String searchName,

      @Schema(description = "Listing id that matched", example = "owner_listing_2010")
      String listingId,

      @Schema(description = "Listing title", example = "Bright 2BHK in Indiranagar")
      String listingTitle,

      @Schema(description = "Listing locality", example = "Indiranagar")
      String listingLocality,

      @Schema(description = "Listing city", example = "Bengaluru")
      String listingCity,

      @Schema(description = "Listing rent (rupees)", example = "32000")
      int listingRent,

      @Schema(description = "Listing BHK", example = "2BHK")
      String listingBhk,

      @Schema(description = "Status", example = "NEW",
          allowableValues = {"NEW", "READ", "DISMISSED"})
      String status,

      @Schema(description = "ISO timestamp when the alert was created",
          example = "2026-05-08T11:30:00Z")
      String createdAt
  ) {}
}
