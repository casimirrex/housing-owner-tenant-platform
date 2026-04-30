package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Result of wallet top-up verification")
public record WalletTopupVerifyResponse(
    @Schema(description = "Whether the top-up was successfully applied", example = "true")
    boolean success,
    @Schema(description = "New wallet balance after top-up (in smallest currency unit)", example = "5000")
    long newBalance,
    @Schema(description = "ISO currency code", example = "USD")
    String currency,
    @Schema(description = "Amount credited in this transaction", example = "2000")
    int amountCredited,
    @Schema(description = "Status message", example = "Wallet topped up successfully.")
    String message,
    @Schema(description = "Timestamp of completion", example = "2026-04-16T10:30:00Z")
    String completedAt
) {
}
