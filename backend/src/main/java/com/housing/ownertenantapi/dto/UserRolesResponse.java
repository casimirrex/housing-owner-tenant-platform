package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * What roles is the current user entitled to use, and which one is currently
 * active on the session? Used by the frontend RoleSwitcher component.
 */
@Schema(description = "Roles available to the current user + the currently active one")
public record UserRolesResponse(
    @Schema(description = "Roles the user can switch to", example = "[\"TENANT\",\"OWNER\"]")
    List<String> availableRoles,

    @Schema(description = "Currently active role on the session", example = "TENANT")
    String activeRole
) {}
