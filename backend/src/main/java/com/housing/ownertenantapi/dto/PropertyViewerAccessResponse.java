package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Viewer access rules for the property detail page")
public record PropertyViewerAccessResponse(
    @Schema(description = "Resolved access level for the current viewer", example = "TEASER")
    String accessLevel,
    @Schema(description = "Resolved viewer role for the current viewer", example = "TENANT")
    String viewerRole,
    @Schema(description = "Whether the full page requires a premium tenant plan", example = "true")
    boolean premiumRequired,
    @Schema(description = "Whether the current viewer already has an active premium tenant plan", example = "false")
    boolean premiumActive,
    @Schema(description = "Whether the viewer is using an owner-level view", example = "false")
    boolean ownerView,
    @Schema(description = "Short headline for the locked or unlocked state", example = "Unlock the full listing profile")
    String headline,
    @Schema(description = "Explanation of what the viewer can do in the current state")
    String message,
    @Schema(description = "Premium plan code when an upgrade is available", example = "TENANT_PREMIUM_ANNUAL")
    String upgradePlanCode,
    @Schema(description = "Premium plan display name when an upgrade is available", example = "Tenant Premium")
    String upgradePlanName,
    @Schema(description = "Upgrade price in rupees when an upgrade is available", example = "500")
    Long upgradePrice,
    @Schema(description = "Upgrade plan currency", example = "INR")
    String upgradeCurrency,
    @Schema(description = "Upgrade cadence label", example = "per year")
    String upgradePeriodLabel
) {
}
