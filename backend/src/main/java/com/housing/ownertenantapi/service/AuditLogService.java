package com.housing.ownertenantapi.service;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Phase 1 — append-only audit trail.
 *
 * Every admin action that mutates user data, refunds money, deletes
 * accounts, moderates listings, etc., should call {@link #record} so
 * we have a "who did what when" record.
 *
 * Best-effort by design: audit failures NEVER break the original action.
 * The caller wraps the call in a try/catch and lets {@link #record}
 * swallow any DB error itself.
 */
@Service
public class AuditLogService {

  private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

  private final JdbcTemplate jdbcTemplate;

  public AuditLogService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  /**
   * @param actorUserId  the user_id taking the action (admin, owner, tenant). May be null for system actions.
   * @param actorRole    role of the actor at the moment of the action (e.g. "ADMIN")
   * @param action       short verb-like identifier, e.g. "WALLET_REFUND" or "LISTING_SUSPENDED"
   * @param entityType   the kind of entity acted on, e.g. "wallet_account" or "listing"
   * @param entityId     the entity id, free-form text
   * @param payload      JSON or human-readable details
   */
  public void record(
      String actorUserId,
      String actorRole,
      String action,
      String entityType,
      String entityId,
      String payload
  ) {
    try {
      String auditId = "aud_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
      jdbcTemplate.update("""
              INSERT INTO audit_log (
                audit_id, actor_user_id, actor_role, action, entity_type, entity_id, payload
              )
              VALUES (?, ?, ?, ?, ?, ?, ?)
              """,
          auditId, actorUserId, actorRole, action, entityType, entityId, payload
      );
    } catch (Exception e) {
      log.warn("audit_log insert failed (action={} entity={}/{}): {}",
          action, entityType, entityId, e.getMessage());
    }
  }
}
