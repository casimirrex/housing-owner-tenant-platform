package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after deactivating the logged-in user account")
public record UserAccountDeactivationResponse(
    @Schema(description = "Whether the account was deactivated", example = "true")
    boolean deactivated,
    @Schema(description = "User id", example = "user_1a2b3c4d")
    String userId,
    @Schema(description = "Updated profile status", example = "DEACTIVATED")
    String profileStatus,
    @Schema(description = "User-facing status message", example = "Account deactivated successfully.")
    String message,
    @Schema(description = "Deactivation timestamp", example = "2026-04-09T15:40:00Z")
    String deactivatedAt
) {
}
