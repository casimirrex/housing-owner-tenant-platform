package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to start registration with email")
public record EmailRegistrationRequest(
    @Schema(description = "User full name", example = "Aarav Kumar")
    @NotBlank
    String fullName,
    @Schema(description = "User email address", example = "aarav@example.com")
    @NotBlank
    @Email
    String email
) {
}
