package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Wallet dashboard: balance and transaction history")
public record WalletDashboardResponse(
    @Schema(description = "Internal wallet id", example = "wallet_xyz")
    String walletId,
    @Schema(description = "User id", example = "user_1a2b3c4d")
    String userId,
    @Schema(description = "Display name of the wallet owner", example = "Aarav Kumar")
    String ownerName,
    @Schema(description = "Current balance in smallest currency unit", example = "5000")
    long balance,
    @Schema(description = "ISO currency code", example = "USD")
    String currency,
    @Schema(description = "Human-readable balance", example = "$50.00")
    String balanceFormatted,
    @Schema(description = "Active gateway mode", example = "STRIPE")
    String providerMode,
    @Schema(description = "Whether Stripe keys are configured", example = "true")
    boolean stripeConfigured,
    @Schema(description = "Recent transactions (newest first)")
    List<WalletTransactionItemResponse> transactions
) {
}
