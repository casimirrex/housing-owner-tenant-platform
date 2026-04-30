package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Result of activating the tenant premium plan")
public record TenantPremiumActivationResponse(
    @Schema(description = "Whether premium access is active after this operation", example = "true")
    boolean premiumActive,
    @Schema(description = "Subscription id", example = "sub_tenant_premium_1002")
    String subscriptionId,
    @Schema(description = "Plan code", example = "TENANT_PREMIUM_ANNUAL")
    String planCode,
    @Schema(description = "Subscription status", example = "ACTIVE")
    String subscriptionStatus,
    @Schema(description = "Premium access start timestamp", example = "2026-04-30T10:00:00Z")
    String activeFrom,
    @Schema(description = "Premium access expiry timestamp", example = "2027-04-30T10:00:00Z")
    String activeUntil,
    @Schema(description = "Wallet balance remaining after activation, in rupees", example = "150")
    long walletBalance,
    @Schema(description = "Success or idempotency message")
    String message
) {
}
