package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Payment history line item")
public record PaymentHistoryItemResponse(
    @Schema(description = "Internal payment id", example = "payment_3000")
    String paymentId,
    @Schema(description = "Listing id", example = "listing_001")
    String listingId,
    @Schema(description = "Listing title", example = "Sunny 2BHK near Indiranagar Metro")
    String listingTitle,
    @Schema(description = "Counterparty name", example = "Rohit Mehta")
    String counterpartyName,
    @Schema(description = "Payment label", example = "Security deposit")
    String paymentLabel,
    @Schema(description = "Payment kind", example = "SECURITY_DEPOSIT")
    String paymentKind,
    @Schema(description = "Gateway mode", example = "MOCK")
    String providerMode,
    @Schema(description = "Status", example = "CAPTURED")
    String status,
    @Schema(description = "Amount", example = "96000")
    int amount,
    @Schema(description = "Currency", example = "INR")
    String currency,
    @Schema(description = "Due date when relevant", example = "2026-04-10")
    String dueDate,
    @Schema(description = "Paid timestamp when relevant", example = "2026-04-09T09:05:00Z")
    String paidAt
) {
}
