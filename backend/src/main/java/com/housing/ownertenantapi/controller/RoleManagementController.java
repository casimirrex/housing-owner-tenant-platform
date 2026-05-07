package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.RoleRequest;
import com.housing.ownertenantapi.dto.UserRolesResponse;
import com.housing.ownertenantapi.service.CurrentSessionService;
import com.housing.ownertenantapi.service.RoleManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Multi-role-per-user endpoints (Bug F).
 *   GET  /api/v1/auth/roles/me      — list available + active roles
 *   POST /api/v1/auth/roles/add     — add a role to the current user
 *   POST /api/v1/auth/roles/switch  — set the active role on the session
 *
 * Existing role-gated endpoints (everything that calls
 * CurrentSessionService.requireRole) are unchanged — they still read
 * users.role which switchRole() updates.
 */
@RestController
@RequestMapping("/api/v1/auth/roles")
@Tag(name = "Role management", description = "Multi-role-per-user (TENANT and/or OWNER)")
public class RoleManagementController {

  private static final String SIGN_IN_MESSAGE = "Sign in to manage your account roles.";

  private final RoleManagementService roleManagementService;
  private final CurrentSessionService currentSessionService;

  public RoleManagementController(
      RoleManagementService roleManagementService,
      CurrentSessionService currentSessionService
  ) {
    this.roleManagementService = roleManagementService;
    this.currentSessionService = currentSessionService;
  }

  @GetMapping("/me")
  @Operation(summary = "List the current user's available + active roles")
  public UserRolesResponse getMyRoles(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    CurrentSessionService.SessionIdentity identity =
        currentSessionService.requireSession(authorizationHeader, SIGN_IN_MESSAGE);
    return roleManagementService.getRoles(identity.userId());
  }

  @PostMapping("/add")
  @Operation(
      summary = "Add a role to the current user",
      description = "Idempotent. Does NOT switch the active role — call /switch separately."
  )
  public UserRolesResponse addRole(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody RoleRequest request
  ) {
    CurrentSessionService.SessionIdentity identity =
        currentSessionService.requireSession(authorizationHeader, SIGN_IN_MESSAGE);
    return roleManagementService.addRole(identity.userId(), request.role());
  }

  @PostMapping("/switch")
  @Operation(
      summary = "Switch the active role on the session",
      description = "Forbidden if the user does not already have this role (call /add first)."
  )
  public UserRolesResponse switchRole(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody RoleRequest request
  ) {
    CurrentSessionService.SessionIdentity identity =
        currentSessionService.requireSession(authorizationHeader, SIGN_IN_MESSAGE);
    return roleManagementService.switchRole(identity.userId(), request.role());
  }
}
