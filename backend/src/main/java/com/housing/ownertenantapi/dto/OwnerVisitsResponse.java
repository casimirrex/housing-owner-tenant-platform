package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Visits scheduled on the signed-in owner's listings")
public record OwnerVisitsResponse(
    @Schema(description = "Visits, upcoming first")
    List<OwnerVisit> visits,

    @Schema(description = "How many are SCHEDULED (upcoming)", example = "2")
    long upcomingCount
) {
  @Schema(description = "Single visit row from the owner's perspective")
  public record OwnerVisit(
      @Schema(description = "Visit id", example = "visit_1001")
      String visitId,

      @Schema(description = "Listing id", example = "listing_001")
      String listingId,

      @Schema(description = "Listing title", example = "Bright 2BHK in Indiranagar")
      String listingTitle,

      @Schema(description = "Tenant id", example = "user_xyz")
      String tenantId,

      @Schema(description = "Tenant name", example = "Aarav Kumar")
      String tenantName,

      @Schema(description = "Tenant email", example = "aarav@example.com")
      String tenantEmail,

      @Schema(description = "Tenant phone (if available)", example = "+91-9876543210")
      String tenantPhone,

      @Schema(description = "Slot id", example = "slot_morning_1")
      String slotId,

      @Schema(description = "Slot label", example = "10:00 AM - 10:30 AM")
      String slotLabel,

      @Schema(description = "Preferred visit date (YYYY-MM-DD)", example = "2026-04-12")
      String preferredDate,

      @Schema(description = "Tenant's notes", example = "Please call 15 mins before arrival")
      String notes,

      @Schema(description = "Status", example = "SCHEDULED",
          allowableValues = {"SCHEDULED", "COMPLETED", "CANCELLED"})
      String status,

      @Schema(description = "ISO timestamp when the visit was booked", example = "2026-04-10T14:30:00Z")
      String scheduledAt
  ) {}
}
