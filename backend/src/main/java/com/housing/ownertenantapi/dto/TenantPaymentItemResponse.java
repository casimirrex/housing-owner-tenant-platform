package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Tenant-side payment due or payable item")
public record TenantPaymentItemResponse(
    @Schema(description = "Internal payment id", example = "payment_3001")
    String paymentId,
    @Schema(description = "Listing id", example = "listing_001")
    String listingId,
    @Schema(description = "Listing title", example = "Sunny 2BHK near Indiranagar Metro")
    String listingTitle,
    @Schema(description = "Listing locality", example = "Indiranagar")
    String locality,
    @Schema(description = "Listing city", example = "Bengaluru")
    String city,
    @Schema(description = "Payment label", example = "April 2026 rent")
    String paymentLabel,
    @Schema(description = "Payment kind", example = "MONTHLY_RENT")
    String paymentKind,
    @Schema(description = "Payment status", example = "DUE")
    String status,
    @Schema(description = "Amount in rupees", example = "32000")
    int amount,
    @Schema(description = "Currency code", example = "INR")
    String currency,
    @Schema(description = "Due date", example = "2026-04-18")
    String dueDate,
    @Schema(description = "Owner name", example = "Rohit Mehta")
    String ownerName
) {
}
