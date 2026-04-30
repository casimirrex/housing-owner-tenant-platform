package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to verify and complete a wallet top-up")
public record WalletTopupVerifyRequest(
    @NotBlank(message = "txnId is required")
    @Schema(description = "Internal wallet transaction id returned from checkout", example = "wtxn_abc123")
    String txnId,
    @NotBlank(message = "paymentIntentId is required")
    @Schema(description = "Stripe PaymentIntent id", example = "pi_3PnXwT2eZvKYlo2C1TXDmjkV")
    String paymentIntentId
) {
}
