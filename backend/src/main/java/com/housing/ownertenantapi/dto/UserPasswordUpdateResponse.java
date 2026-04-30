package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after setting or updating the logged-in user's app password")
public record UserPasswordUpdateResponse(
    @Schema(description = "Whether the password change was applied", example = "true")
    boolean updated,
    @Schema(description = "User id", example = "user_1a2b3c4d")
    String userId,
    @Schema(description = "Whether the account now has a password configured", example = "true")
    boolean hasPassword,
    @Schema(description = "Human-readable result message", example = "App password saved successfully.")
    String message,
    @Schema(description = "Timestamp when the password was updated", example = "2026-04-13T13:30:00Z")
    String updatedAt
) {
}
