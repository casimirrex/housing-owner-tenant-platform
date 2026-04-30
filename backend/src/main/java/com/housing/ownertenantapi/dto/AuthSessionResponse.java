package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response for auth endpoints that return an authenticated session")
public record AuthSessionResponse(
    @Schema(description = "JWT access token", example = "access_4f8bc5d92c7f4f7fa8c8")
    String accessToken,
    @Schema(description = "Refresh token", example = "refresh_d75dff3396eb4c6485d2")
    String refreshToken,
    @Schema(description = "Token type", example = "Bearer")
    String tokenType,
    @Schema(description = "Seconds until the access token expires", example = "3600")
    long expiresInSeconds,
    @Schema(description = "Authenticated user id", example = "user_1a2b3c4d")
    String userId,
    @Schema(description = "Authenticated user role", example = "TENANT")
    String role,
    @Schema(description = "Authentication method", example = "OTP")
    String authMethod,
    @Schema(description = "Authenticated email address when available", example = "aarav@example.com")
    String email,
    @Schema(description = "Authenticated user full name when available", example = "Aarav Kumar")
    String fullName,
    @Schema(description = "Authenticated user avatar URL when available", example = "https://images.example.com/users/aarav.jpg")
    String avatarUrl,
    @Schema(description = "Whether the provider or platform has verified the user's email", example = "true")
    Boolean emailVerified,
    @Schema(description = "Status message", example = "OTP verified successfully.")
    String message,
    @Schema(description = "Implementation phase", example = "1")
    int phase
) {
}
