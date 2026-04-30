package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Payment gateway configuration currently active in the app")
public record PaymentGatewaySummaryResponse(
    @Schema(description = "Gateway mode used for checkout", example = "MOCK")
    String providerMode,
    @Schema(description = "Display label for the gateway", example = "Local sandbox")
    String providerLabel,
    @Schema(description = "Whether a public checkout key is available", example = "false")
    boolean publicKeyAvailable,
    @Schema(description = "Checkout script URL when relevant", example = "https://checkout.razorpay.com/v1/checkout.js")
    String checkoutScriptUrl,
    @Schema(description = "Guidance for the current environment")
    String guidance
) {
}
