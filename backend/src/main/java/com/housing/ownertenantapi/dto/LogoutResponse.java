package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after signing out an authenticated session")
public record LogoutResponse(
    @Schema(description = "Whether sign-out completed", example = "true")
    boolean signedOut,
    @Schema(description = "How many sessions were revoked", example = "1")
    int revokedSessionCount,
    @Schema(description = "User-facing logout status", example = "Session sign-out completed successfully.")
    String message,
    @Schema(description = "When sign-out completed", example = "2026-04-09T15:20:00Z")
    String signedOutAt
) {
}
