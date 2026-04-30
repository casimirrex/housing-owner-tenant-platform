package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Stripe checkout details for wallet top-up")
public record WalletTopupCheckoutResponse(
    @Schema(description = "Internal wallet transaction id", example = "wtxn_abc123")
    String txnId,
    @Schema(description = "Stripe PaymentIntent id", example = "pi_3PnXwT2eZvKYlo2C1TXDmjkV")
    String paymentIntentId,
    @Schema(description = "Stripe client secret for frontend confirmation", example = "pi_3P..._secret_...")
    String clientSecret,
    @Schema(description = "Stripe publishable key", example = "pk_test_...")
    String publishableKey,
    @Schema(description = "Amount in smallest currency unit", example = "2000")
    int amount,
    @Schema(description = "ISO currency code", example = "USD")
    String currency,
    @Schema(description = "Human-readable description", example = "Wallet top-up — $20.00")
    String description,
    @Schema(description = "Customer name", example = "Aarav Kumar")
    String customerName,
    @Schema(description = "Customer email", example = "aarav@example.com")
    String customerEmail,
    @Schema(description = "Gateway mode", example = "STRIPE")
    String providerMode
) {
}
