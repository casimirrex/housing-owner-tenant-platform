package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to confirm and verify a completed payment")
public record PaymentVerificationRequest(
    @NotBlank
    @Schema(description = "Internal payment id", example = "payment_3001")
    String paymentId,
    @Schema(description = "Gateway order id", example = "order_9A33XWu170gUtm")
    String providerOrderId,
    @Schema(description = "Gateway payment id", example = "pay_29QQoUBi66xm2f")
    String providerPaymentId,
    @Schema(description = "Gateway signature", example = "9ef4dffbdd...")
    String providerSignature
) {
}
