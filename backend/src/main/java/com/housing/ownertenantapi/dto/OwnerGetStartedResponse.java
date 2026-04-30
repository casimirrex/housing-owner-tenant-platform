package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after creating an owner account and first live listing")
public record OwnerGetStartedResponse(
    @Schema(description = "Authenticated owner session")
    AuthSessionResponse session,
    @Schema(description = "Created live listing")
    OwnerListingCreateResponse listing,
    @Schema(description = "Suggested next page", example = "/owner/dashboard")
    String dashboardHref,
    @Schema(description = "User-facing confirmation message", example = "Owner account created and your first listing is live.")
    String message
) {
}
