package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Recent leads received by the signed-in owner")
public record OwnerLeadsResponse(
    @Schema(description = "Leads, newest first")
    List<Lead> leads,

    @Schema(description = "Number of NEW (unviewed) leads", example = "3")
    long newCount
) {
  @Schema(description = "A single lead row")
  public record Lead(
      @Schema(description = "Lead id", example = "lead_8f3a2c")
      String leadId,

      @Schema(description = "Listing the tenant expressed interest in", example = "owner_listing_2007")
      String listingId,

      @Schema(description = "Listing title", example = "Bright 2BHK in Indiranagar")
      String listingTitle,

      @Schema(description = "Tenant id (use for follow-up)", example = "user_xyz")
      String tenantId,

      @Schema(description = "Tenant full name", example = "Aarav Kumar")
      String tenantName,

      @Schema(description = "Tenant email", example = "aarav@example.com")
      String tenantEmail,

      @Schema(description = "Tenant phone (if available)", example = "+91-9876543210")
      String tenantPhone,

      @Schema(description = "Tenant's optional message", example = "Looking to move 1st June")
      String message,

      @Schema(description = "Lead status", example = "NEW",
          allowableValues = {"NEW", "VIEWED", "RESPONDED", "ARCHIVED"})
      String status,

      @Schema(description = "Amount tenant paid (rupees)", example = "49")
      long amountPaid,

      @Schema(description = "ISO timestamp when the lead was created", example = "2026-05-07T14:00:00Z")
      String createdAt
  ) {}
}
