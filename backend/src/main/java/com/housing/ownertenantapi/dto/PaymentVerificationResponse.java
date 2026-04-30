package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Verification result after a payment completes")
public record PaymentVerificationResponse(
    @Schema(description = "Whether the backend accepted the payment confirmation", example = "true")
    boolean verified,
    @Schema(description = "Final payment status", example = "CAPTURED")
    String status,
    @Schema(description = "Result message")
    String message,
    @Schema(description = "Captured timestamp", example = "2026-04-14T09:30:00Z")
    String paidAt
) {
}
