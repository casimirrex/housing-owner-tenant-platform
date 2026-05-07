package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Owner information displayed on the property detail page")
public record PropertyOwnerInfoResponse(
    @Schema(description = "Owner id", example = "owner_101")
    String ownerId,
    @Schema(description = "Owner display name", example = "Rohit Mehta")
    String name,
    @Schema(description = "Masked phone number", example = "+91******2109")
    String phoneMasked,
    @Schema(description = "Owner response time commitment shown to tenants", example = "Replies in about 10 mins")
    String responseTimeCommitment,
    @Schema(description = "Preferred language", example = "English, Hindi")
    String preferredLanguage,
    @Schema(description = "Owner badge", example = "Top responsive owner")
    String badge,
    @Schema(description = "Years on platform", example = "3")
    int yearsOnPlatform,
    @Schema(description = "Whether the owner has paid for Verified Owner badge (Tier 1 #2)", example = "true")
    boolean verifiedOwner
) {
}
