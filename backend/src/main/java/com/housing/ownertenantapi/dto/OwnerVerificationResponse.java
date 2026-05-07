package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Result of owner verification (Verified Owner Badge)")
public record OwnerVerificationResponse(
    @Schema(description = "Whether this owner is verified", example = "true")
    boolean verified,

    @Schema(description = "ISO timestamp when the badge was paid for", example = "2026-05-07T12:00:00Z")
    String verifiedAt,

    @Schema(description = "Amount deducted from wallet (rupees)", example = "199")
    long amountPaid,

    @Schema(description = "Currency", example = "INR")
    String currency,

    @Schema(description = "Updated wallet balance after deduction", example = "301")
    long walletBalance,

    @Schema(description = "Confirmation message")
    String message
) {}
