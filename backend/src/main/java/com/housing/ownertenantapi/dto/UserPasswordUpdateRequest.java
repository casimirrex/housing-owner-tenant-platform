package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request to set or update the logged-in user's app password")
public record UserPasswordUpdateRequest(
    @Schema(description = "New password for email or phone login", example = "StrongPassword@123")
    @NotBlank
    @Size(min = 8, max = 72)
    String newPassword
) {
}
