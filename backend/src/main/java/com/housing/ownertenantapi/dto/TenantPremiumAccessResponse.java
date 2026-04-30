package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Current tenant premium plan status and activation readiness")
public record TenantPremiumAccessResponse(
    @Schema(description = "Plan code", example = "TENANT_PREMIUM_ANNUAL")
    String planCode,
    @Schema(description = "Plan display name", example = "Tenant Premium")
    String planName,
    @Schema(description = "Plan description")
    String description,
    @Schema(description = "Price in rupees for the configured billing period", example = "500")
    long priceAmount,
    @Schema(description = "Plan currency", example = "INR")
    String currency,
    @Schema(description = "Billing period label", example = "ANNUAL")
    String billingPeriod,
    @Schema(description = "Plan validity in days", example = "365")
    int validityDays,
    @Schema(description = "Whether the tenant currently has active premium access", example = "false")
    boolean premiumActive,
    @Schema(description = "Latest subscription status when present", example = "ACTIVE")
    String subscriptionStatus,
    @Schema(description = "Current subscription start timestamp when active", example = "2026-04-01T08:00:00Z")
    String activeFrom,
    @Schema(description = "Current subscription expiry timestamp when active", example = "2027-04-01T08:00:00Z")
    String activeUntil,
    @Schema(description = "Current wallet balance in rupees", example = "650")
    long walletBalance,
    @Schema(description = "Formatted wallet balance string", example = "Rs. 650")
    String walletBalanceFormatted,
    @Schema(description = "Whether the tenant can activate premium right now", example = "true")
    boolean canActivate,
    @Schema(description = "Additional amount needed when wallet balance is insufficient", example = "0")
    long shortfallAmount,
    @Schema(description = "Business-facing helper message for the current state")
    String message
) {
}
