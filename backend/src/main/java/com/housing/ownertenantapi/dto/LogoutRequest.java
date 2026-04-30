package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to sign out an authenticated session")
public record LogoutRequest(
    @Schema(description = "Refresh token for the active session", example = "refresh_d75dff3396eb4c6485d2")
    @NotBlank
    String refreshToken
) {
}
