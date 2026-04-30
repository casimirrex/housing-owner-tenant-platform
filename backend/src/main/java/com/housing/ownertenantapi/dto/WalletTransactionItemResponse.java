package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "A single wallet transaction record")
public record WalletTransactionItemResponse(
    @Schema(description = "Transaction id", example = "wtxn_abc123")
    String txnId,
    @Schema(description = "Transaction type: TOPUP | DEBIT", example = "TOPUP")
    String txnType,
    @Schema(description = "Amount in smallest currency unit", example = "2000")
    long amount,
    @Schema(description = "ISO currency code", example = "USD")
    String currency,
    @Schema(description = "Status: PENDING | COMPLETED | FAILED", example = "COMPLETED")
    String status,
    @Schema(description = "Description of the transaction", example = "Wallet top-up — $20.00")
    String description,
    @Schema(description = "When the transaction was created", example = "2026-04-16T10:30:00Z")
    String createdAt,
    @Schema(description = "When the transaction completed (null if still pending)", example = "2026-04-16T10:30:05Z")
    String completedAt
) {
}
