package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Result of expressing interest (lead created + wallet deducted)")
public record LeadContactResponse(
    @Schema(description = "Lead id", example = "lead_8f3a2c")
    String leadId,

    @Schema(description = "Listing the lead is for", example = "owner_listing_2007")
    String listingId,

    @Schema(description = "Amount deducted from tenant wallet (rupees)", example = "49")
    long amountPaid,

    @Schema(description = "Currency", example = "INR")
    String currency,

    @Schema(description = "Updated wallet balance after deduction", example = "451")
    long walletBalance,

    @Schema(description = "ISO timestamp when the lead was created", example = "2026-05-07T14:00:00Z")
    String createdAt,

    @Schema(description = "Confirmation message")
    String message
) {}
