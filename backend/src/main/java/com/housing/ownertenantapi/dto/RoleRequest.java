package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Body for both add-role and switch-role endpoints. Single value: the role.
 * Validated against the same set the DB CHECK constraint enforces.
 */
@Schema(description = "Role action body — used by /api/v1/auth/roles/add and /switch")
public record RoleRequest(
    @NotBlank
    @Pattern(regexp = "TENANT|OWNER", message = "role must be TENANT or OWNER")
    @Schema(description = "Target role", example = "OWNER", allowableValues = {"TENANT", "OWNER"})
    String role
) {}
