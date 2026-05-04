package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request to register with email and password")
public record EmailRegistrationRequest(
    @Schema(description = "User full name", example = "Aarav Kumar")
    @NotBlank
    String fullName,
    @Schema(description = "User email address", example = "aarav@example.com")
    @NotBlank
    @Email
    String email,
    @Schema(description = "Account password (min 8 chars)", example = "MyStrongPass123")
    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password,
    @Schema(description = "Optional role: TENANT or OWNER (default TENANT)", example = "TENANT")
    String role
) {
}
