package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.UserRolesResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Multi-role-per-user management (Bug F).
 *
 * A user's "available roles" live in user_roles (one row per role).
 * users.role is the "currently-active" role for the session — every existing
 * role-gated endpoint resolves it via CurrentSessionService.requireRole(...)
 * unchanged, so we don't have to touch any of those.
 *
 * - addRole(userId, role)    : INSERT into user_roles (idempotent, ON CONFLICT DO NOTHING).
 * - switchRole(userId, role) : validates user_roles, then UPDATE users.role.
 * - getRoles(userId)         : reads from user_roles + users.
 */
@Service
public class RoleManagementService {

  private static final List<String> SUPPORTED_ROLES = List.of("TENANT", "OWNER");

  private final JdbcClient jdbcClient;

  public RoleManagementService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  /** Read-only: list user's available roles + currently-active role. */
  public UserRolesResponse getRoles(String userId) {
    List<String> availableRoles = jdbcClient.sql("""
            SELECT role
            FROM user_roles
            WHERE user_id = :userId
            ORDER BY granted_at ASC
            """)
        .param("userId", userId)
        .query(String.class)
        .list();

    String activeRole = jdbcClient.sql("""
            SELECT role FROM users WHERE user_id = :userId
            """)
        .param("userId", userId)
        .query(String.class)
        .optional()
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND, "User not found."));

    return new UserRolesResponse(availableRoles, activeRole);
  }

  /**
   * Add a role to the user. Idempotent — if the user already has the role,
   * this is a no-op (ON CONFLICT DO NOTHING). Active role is NOT changed —
   * call switchRole() separately if you want to switch to it.
   */
  @Transactional
  public UserRolesResponse addRole(String userId, String requestedRole) {
    String role = normalizeRole(requestedRole);

    jdbcClient.sql("""
            INSERT INTO user_roles (user_id, role, granted_at)
            VALUES (:userId, :role, :grantedAt)
            ON CONFLICT (user_id, role) DO NOTHING
            """)
        .param("userId", userId)
        .param("role", role)
        .param("grantedAt", OffsetDateTime.now(ZoneOffset.UTC))
        .update();

    return getRoles(userId);
  }

  /**
   * Switch the active role on this session. Validates that the user actually
   * has this role (in user_roles); throws 403 otherwise. Updates users.role
   * so the next session resolution returns the new role — no token change.
   */
  @Transactional
  public UserRolesResponse switchRole(String userId, String requestedRole) {
    String role = normalizeRole(requestedRole);

    if (!userHasRole(userId, role)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "You do not have the " + role + " role. Add it first via /api/v1/auth/roles/add."
      );
    }

    int updated = jdbcClient.sql("""
            UPDATE users SET role = :role, updated_at = :updatedAt
            WHERE user_id = :userId
            """)
        .param("userId", userId)
        .param("role", role)
        .param("updatedAt", OffsetDateTime.now(ZoneOffset.UTC))
        .update();

    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.");
    }

    return getRoles(userId);
  }

  /* ── helpers ─────────────────────────────────────────────────────────── */

  private boolean userHasRole(String userId, String role) {
    return Boolean.TRUE.equals(jdbcClient.sql("""
            SELECT EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_id = :userId AND role = :role
            )
            """)
        .param("userId", userId)
        .param("role", role)
        .query(Boolean.class)
        .single());
  }

  private static String normalizeRole(String raw) {
    if (raw == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role is required");
    }
    String upper = raw.trim().toUpperCase(Locale.ROOT);
    if (!SUPPORTED_ROLES.contains(upper)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "role must be one of " + SUPPORTED_ROLES + " (got: " + raw + ")"
      );
    }
    return upper;
  }
}
