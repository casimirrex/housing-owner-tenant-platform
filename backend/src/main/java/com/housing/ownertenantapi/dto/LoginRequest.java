package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Login request using phone or email and password")
public record LoginRequest(
    @Schema(description = "Email address or phone number", example = "aarav@example.com")
    @NotBlank
    String identifier,
    @Schema(description = "Password or login secret", example = "StrongPassword@123")
    @NotBlank
    String password,
    @Schema(description = "Optional role intent for routing the login flow", example = "OWNER")
    String roleHint
) {
}
